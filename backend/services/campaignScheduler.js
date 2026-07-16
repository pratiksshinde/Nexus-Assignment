const { Op } = require("sequelize");
const { Campaign } = require("../models");
const { sendCampaign } = require("./campaignService");

const processing = new Set();

async function processDueCampaigns() {
  const campaigns = await Campaign.findAll({
    where: {
      status: "scheduled",
      scheduled_at: { [Op.lte]: new Date() },
    },
    attributes: ["id"],
  });

  await Promise.all(campaigns.map(async ({ id }) => {
    if (processing.has(id)) return;
    processing.add(id);

    try {
      await sendCampaign(id);
    } catch (error) {
      console.error(`Campaign ${id} failed`, error);
      await Campaign.update(
        { status: "failed", failure_reason: error.message },
        { where: { id, status: { [Op.in]: ["scheduled", "sending"] } } },
      );
    } finally {
      processing.delete(id);
    }
  }));
}

function startCampaignScheduler() {
  processDueCampaigns().catch((error) => console.error("Campaign scheduler failed", error));
  const timer = setInterval(
    () => processDueCampaigns().catch((error) => console.error("Campaign scheduler failed", error)),
    5000,
  );
  timer.unref();
}

module.exports = { processDueCampaigns, startCampaignScheduler };
