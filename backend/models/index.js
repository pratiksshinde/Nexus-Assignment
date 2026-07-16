const sequelize = require("../config/database");

const Workspace = require("./workspace");
const User = require("./user");
const Contact = require("./contact");
const Tag = require("./tag");
const ContactTag = require("./contactTag");
const Audience = require("./audience");
const Campaign = require("./campaign");
const CampaignRecipient = require("./campaignRecipient");

const models = {
  Workspace,
  User,
  Contact,
  Tag,
  ContactTag,
  Audience,
  Campaign,
  CampaignRecipient,
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  ...models,
};
