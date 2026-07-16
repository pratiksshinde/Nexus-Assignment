const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Campaign = sequelize.define(
  "Campaign",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    workspace_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "workspaces",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    body_html: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    recipient_source: {
      type: DataTypes.ENUM("audience", "tag", "manual"),
      allowNull: false,
    },

    recipient_source_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },

    status: {
      type: DataTypes.ENUM(
        "draft",
        "scheduled",
        "sending",
        "sent",
        "failed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "draft",
    },

    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "campaigns",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        fields: ["workspace_id"],
      },
      {
        fields: ["workspace_id", "status"],
      },
      {
        fields: ["scheduled_at"],
      },
    ],
  }
);

Campaign.associate = (models) => {
  Campaign.belongsTo(models.Workspace, {
    foreignKey: "workspace_id",
    as: "workspace",
  });

  Campaign.hasMany(models.CampaignRecipient, {
    foreignKey: "campaign_id",
    as: "recipients",
    onDelete: "CASCADE",
  });
};

module.exports = Campaign;