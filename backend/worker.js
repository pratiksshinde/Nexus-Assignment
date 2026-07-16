require("dotenv").config({ quiet: true });

const { Worker } = require("bullmq");
const { Op } = require("sequelize");
const { sequelize, Campaign } = require("./models");
const { enqueueCampaign, getConnection } = require("./queues/campaignQueue");
const { sendCampaign } = require("./services/campaignService");

async function recoverScheduledCampaigns() {
  const campaigns = await Campaign.findAll({
    where: { status: "scheduled" },
    attributes: ["id", "scheduled_at"],
  });

  for (const campaign of campaigns) {
    await enqueueCampaign(campaign.id, campaign.scheduled_at || new Date());
  }
}

async function startWorker() {
  await sequelize.authenticate();
  await recoverScheduledCampaigns();

  const worker = new Worker(
    "campaigns",
    (job) => sendCampaign(job.data.campaignId),
    { connection: getConnection(), concurrency: 2 },
  );

  worker.on("completed", (job) => console.log(`Campaign ${job.data.campaignId} sent`));
  worker.on("failed", async (job, error) => {
    console.error(`Campaign ${job?.data.campaignId} failed`, error.message);
    if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
      await Campaign.update(
        { status: "failed", failure_reason: error.message },
        { where: { id: job.data.campaignId, status: { [Op.in]: ["scheduled", "sending"] } } },
      );
    }
  });
  console.log("Campaign worker running");
}

startWorker().catch((error) => {
  console.error("Campaign worker failed to start", error);
  process.exit(1);
});
