const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CampaignRecipient = sequelize.define(
  "CampaignRecipient",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    campaign_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "campaigns", key: "id" },
      onDelete: "CASCADE",
    },
    contact_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "contacts", key: "id" },
      onDelete: "SET NULL",
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: DataTypes.STRING(150),
    provider_message_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "queued",
        "sent",
        "delivered",
        "opened",
        "failed",
        "bounced",
      ),
      allowNull: false,
      defaultValue: "pending",
    },
    sent_at: DataTypes.DATE,
    delivered_at: DataTypes.DATE,
    opened_at: DataTypes.DATE,
    failed_at: DataTypes.DATE,
    failure_reason: DataTypes.TEXT,
  },
  {
    tableName: "campaign_recipients",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["campaign_id", "contact_id"],
        name: "campaign_contact_unique",
      },
      {
        unique: true,
        fields: ["campaign_id", "email"],
        name: "campaign_email_unique",
      },
      { fields: ["campaign_id", "status"] },
    ],
  },
);

CampaignRecipient.associate = (models) => {
  CampaignRecipient.belongsTo(models.Campaign, {
    foreignKey: "campaign_id",
    as: "campaign",
  });
  CampaignRecipient.belongsTo(models.Contact, {
    foreignKey: "contact_id",
    as: "contact",
  });
};

module.exports = CampaignRecipient;
