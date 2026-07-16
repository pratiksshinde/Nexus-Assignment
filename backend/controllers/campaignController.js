const { Op } = require("sequelize");
const { sequelize, Campaign, CampaignRecipient } = require("../models");
const { resolveSource, previewManualRecipients } = require("../services/recipientService");
const { processDueCampaigns } = require("../services/campaignScheduler");

const campaignWhere = (req) => ({ id: req.params.id, workspace_id: req.user.workspace_id });

const analyticsFor = (recipients) => ({
  recipients: recipients.length,
  sent: recipients.filter(({ status }) => ["sent", "delivered", "opened"].includes(status)).length,
  delivered: recipients.filter(({ status }) => ["delivered", "opened"].includes(status)).length,
  opened: recipients.filter(({ status }) => status === "opened").length,
  failed: recipients.filter(({ status }) => ["failed", "bounced"].includes(status)).length,
});

const previewRecipients = async (req, res) => {
  const identifiers = Array.isArray(req.body.identifiers) ? req.body.identifiers : [];
  const results = await previewManualRecipients(identifiers, req.user.workspace_id);
  res.json({ success: true, data: { recipients: results } });
};

const createCampaign = async (req, res) => {
  try {
    const { name, subject, body_html, recipient_source, recipient_source_data = {} } = req.body;
    if (![name, subject, body_html].every((value) => typeof value === "string" && value.trim())) {
      return res.status(400).json({ success: false, message: "Name, subject and email body are required" });
    }

    const preview = await resolveSource(recipient_source, recipient_source_data, req.user.workspace_id);
    const sendable = [...new Map(
      preview.filter((item) => item.sendable).map((item) => [item.contact.id, item.contact]),
    ).values()];
    if (!sendable.length) {
      return res.status(400).json({ success: false, message: "The campaign needs at least one contact with an email" });
    }

    const campaign = await sequelize.transaction(async (transaction) => {
      const created = await Campaign.create({
        workspace_id: req.user.workspace_id,
        name: name.trim(),
        subject: subject.trim(),
        body_html,
        recipient_source,
        recipient_source_data,
      }, { transaction });
      await CampaignRecipient.bulkCreate(sendable.map((contact) => ({
        campaign_id: created.id,
        contact_id: contact.id,
        email: contact.email,
        name: contact.name,
      })), { transaction });
      return created;
    });

    res.status(201).json({
      success: true,
      message: "Campaign created",
      data: { campaign, recipient_preview: preview },
    });
  } catch (error) {
    const badRequest = ["Invalid recipient source", "Manual recipients are required", "Audience not found", "Tag not found"].includes(error.message);
    res.status(badRequest ? 400 : 500).json({ success: false, message: badRequest ? error.message : "Failed to create campaign" });
  }
};

const getCampaigns = async (req, res) => {
  const campaigns = await Campaign.findAll({
    where: { workspace_id: req.user.workspace_id },
    include: [{
      model: CampaignRecipient,
      as: "recipients",
      attributes: ["status"],
    }],
    order: [["createdAt", "DESC"]],
  });
  res.json({ success: true, data: { campaigns: campaigns.map((campaign) => ({
    ...campaign.toJSON(),
    analytics: analyticsFor(campaign.recipients),
    recipients: undefined,
  })) } });
};

const getCampaign = async (req, res) => {
  const campaign = await Campaign.findOne({ where: campaignWhere(req) });
  if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(5, Number(req.query.limit) || 10));
  const allowedStatuses = ["pending", "queued", "sent", "delivered", "opened", "failed", "bounced"];
  const requestedStatus = String(req.query.status || "");
  const status = allowedStatuses.includes(requestedStatus) ? requestedStatus : "";
  const search = String(req.query.search || "").trim();
  const where = {
    campaign_id: campaign.id,
    ...(status && status !== "all" && { status }),
    ...(search && {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ],
    }),
  };

  const [allRecipients, recipients] = await Promise.all([
    CampaignRecipient.findAll({ where: { campaign_id: campaign.id }, attributes: ["status"] }),
    CampaignRecipient.findAndCountAll({
      where,
      order: [["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    }),
  ]);

  res.json({
    success: true,
    data: {
      campaign,
      analytics: analyticsFor(allRecipients),
      recipients: recipients.rows,
      pagination: {
        page,
        limit,
        total: recipients.count,
        pages: Math.max(1, Math.ceil(recipients.count / limit)),
      },
    },
  });
};

const updateCampaign = async (req, res) => {
  const campaign = await Campaign.findOne({ where: campaignWhere(req) });
  if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
  if (campaign.status !== "draft") return res.status(409).json({ success: false, message: "Only draft campaigns can be edited" });
  const changes = Object.fromEntries(["name", "subject", "body_html"]
    .filter((field) => req.body[field] !== undefined)
    .map((field) => [field, req.body[field]]));
  if (Object.values(changes).some((value) => typeof value !== "string" || !value.trim())) {
    return res.status(400).json({ success: false, message: "Campaign fields cannot be empty" });
  }
  await campaign.update(changes);
  res.json({ success: true, message: "Campaign updated", data: { campaign } });
};

const sendCampaign = async (req, res) => {
  const campaign = await Campaign.findOne({
    where: campaignWhere(req),
    include: [{ model: CampaignRecipient, as: "recipients", attributes: ["id"] }],
  });
  if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
  if (campaign.status !== "draft") return res.status(409).json({ success: false, message: "Campaign has already been queued" });
  if (!campaign.recipients.length) return res.status(400).json({ success: false, message: "Campaign has no recipients" });

  const sendAt = req.body.scheduled_at ? new Date(req.body.scheduled_at) : new Date();
  if (Number.isNaN(sendAt.getTime()) || sendAt.getTime() < Date.now() - 60000) {
    return res.status(400).json({ success: false, message: "Scheduled time is invalid or in the past" });
  }

  try {
    await campaign.update({ status: "scheduled", scheduled_at: sendAt });
    await CampaignRecipient.update({ status: "queued" }, { where: { campaign_id: campaign.id } });
    if (sendAt <= new Date()) {
      setImmediate(() => processDueCampaigns().catch((error) => console.error("Campaign send failed", error)));
    }
    res.json({ success: true, message: req.body.scheduled_at ? "Campaign scheduled" : "Campaign queued to send", data: { campaign } });
  } catch (error) {
    await campaign.update({ status: "draft", scheduled_at: null });
    await CampaignRecipient.update({ status: "pending" }, { where: { campaign_id: campaign.id, status: "queued" } });
    res.status(503).json({ success: false, message: error.message });
  }
};

module.exports = { previewRecipients, createCampaign, getCampaigns, getCampaign, updateCampaign, sendCampaign };
