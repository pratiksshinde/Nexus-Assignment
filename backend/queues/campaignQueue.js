const { Queue } = require("bullmq");
const IORedis = require("ioredis");

let connection;
let queue;

const redisUrl = () => {
  if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required to send campaigns");
  const url = new URL(process.env.REDIS_URL);
  if (url.hostname.endsWith(".upstash.io") && url.protocol === "redis:") {
    url.protocol = "rediss:";
  }
  return url.toString();
};

const getConnection = () => {
  connection ||= new IORedis(redisUrl(), {
    maxRetriesPerRequest: null,
    connectTimeout: 10000,
    keepAlive: 10000,
    retryStrategy: (attempt) => Math.min(attempt * 500, 5000),
  });
  return connection;
};

const getQueue = () => {
  queue ||= new Queue("campaigns", { connection: getConnection() });
  return queue;
};

const enqueueCampaign = (campaignId, sendAt = new Date()) =>
  getQueue().add(
    "send-campaign",
    { campaignId },
    {
      jobId: `campaign-${campaignId}`,
      delay: Math.max(0, sendAt.getTime() - Date.now()),
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  );

module.exports = { enqueueCampaign, getConnection };
