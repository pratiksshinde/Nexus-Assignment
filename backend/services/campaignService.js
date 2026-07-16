const { Campaign, CampaignRecipient } = require("../models");
const { sendEmail } = require("./emailService");

const sendCampaign = async (campaignId) => {
  if (!process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL) {
    throw new Error("BREVO_API_KEY and SENDER_EMAIL are required");
  }

  const [claimed] = await Campaign.update(
    { status: "sending", failure_reason: null },
    { where: { id: campaignId, status: "scheduled" } },
  );
  if (!claimed) return;

  const campaign = await Campaign.findByPk(campaignId, {
    include: [{ model: CampaignRecipient, as: "recipients" }],
  });
  if (!campaign) return;

  let sent = campaign.recipients.filter((item) => ["sent", "delivered", "opened"].includes(item.status)).length;

  for (const recipient of campaign.recipients.filter((item) => ["pending", "queued"].includes(item.status))) {
    try {
      const messageId = await sendEmail({
        to: recipient.email,
        name: recipient.name,
        subject: campaign.subject,
        htmlContent: campaign.body_html,
      });
      await recipient.update({ provider_message_id: messageId, status: "sent", sent_at: new Date() });
      sent += 1;
    } catch (error) {
      await recipient.update({ status: "failed", failed_at: new Date(), failure_reason: error.message });
    }
  }

  await campaign.update({
    status: sent ? "sent" : "failed",
    sent_at: sent ? new Date() : null,
    failure_reason: sent ? null : "Every recipient failed",
  });
};

module.exports = { sendCampaign };
