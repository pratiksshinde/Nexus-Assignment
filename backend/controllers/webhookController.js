const { CampaignRecipient } = require("../models");
const { normalizeMessageId } = require("../services/emailService");

const brevoWebhook = async (req, res) => {
  if (!process.env.WEBHOOK_SECRET || req.query.token !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ success: false });
  }

  const messageId = normalizeMessageId(req.body["message-id"]);
  const recipient = await CampaignRecipient.findOne({ where: { provider_message_id: messageId } });
  if (!recipient) return res.sendStatus(204);

  const timestamp = req.body.ts_event ? new Date(req.body.ts_event * 1000) : new Date();
  const event = String(req.body.event || "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

  if (["opened", "unique_opened"].includes(event)) {
    await recipient.update({
      opened_at: recipient.opened_at || timestamp,
      ...(recipient.delivered_at && { status: "opened" }),
    });
  } else if (event === "delivered" && recipient.status !== "opened") {
    await recipient.update({
      status: recipient.opened_at ? "opened" : "delivered",
      delivered_at: recipient.delivered_at || timestamp,
      failure_reason: null,
    });
  } else if (event === "deferred" && !["delivered", "opened", "bounced"].includes(recipient.status)) {
    await recipient.update({ failure_reason: req.body.reason || "Delivery deferred by recipient provider" });
  } else if (["hard_bounce", "soft_bounce", "blocked", "invalid", "error"].includes(event)) {
    await recipient.update({ status: "bounced", failed_at: timestamp, failure_reason: req.body.reason || event });
  }

  res.sendStatus(204);
};

module.exports = { brevoWebhook };
