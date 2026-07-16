const { Queue } = require("bullmq");
const IORedis = require("ioredis");

let connection;
let queue;

function getConnection() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is required to schedule campaigns");
  }

  const url = new URL(process.env.REDIS_URL);
  if (!["redis:", "rediss:"].includes(url.protocol)) {
    throw new Error("REDIS_URL must start with redis:// or rediss://");
  }

  connection ||= new IORedis(url.toString(), {
    maxRetriesPerRequest: null,
  });

  return connection;
}

function getQueue() {
  queue ||= new Queue("campaigns", { connection: getConnection() });
  return queue;
}

function enqueueCampaign(campaignId, sendAt = new Date()) {
  return getQueue().add(
    "send-campaign",
    { campaignId },
    {
      jobId: `campaign-${campaignId}`,
      delay: Math.max(0, sendAt.getTime() - Date.now()),
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
}

module.exports = { enqueueCampaign, getConnection };
