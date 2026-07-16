require("dotenv").config({ quiet: true });

const { Worker } = require("bullmq");
const { sequelize, Campaign } = require("./models");
const { enqueueCampaign, getConnection } = require("./queues/campaignQueue");
const { sendCampaign } = require("./services/campaignService");

const recoverScheduledCampaigns = async () => {
  const campaigns = await Campaign.findAll({ where: { status: "scheduled" } });
  await Promise.all(campaigns.map((campaign) =>
    enqueueCampaign(campaign.id, campaign.scheduled_at || new Date())));
  if (campaigns.length) console.log(`Recovered ${campaigns.length} scheduled campaign job(s)`);
};

const start = async () => {
  await sequelize.authenticate();
  const redis = getConnection();
  redis.on("error", (error) => console.error(`Redis connection error: ${error.message}`));
  await redis.ping();
  await recoverScheduledCampaigns();

  const worker = new Worker("campaigns", (job) => sendCampaign(job.data.campaignId), {
    connection: redis,
    concurrency: 2,
  });
  worker.on("completed", (job) => console.log(`Campaign job ${job.id} completed`));
  worker.on("failed", (job, error) => console.error(`Campaign job ${job?.id} failed`, error));
  worker.on("error", (error) => console.error(`Worker error: ${error.message}`));
  console.log("Campaign worker running");
};

start().catch((error) => {
  console.error("Campaign worker failed to start", error);
  process.exit(1);
});
