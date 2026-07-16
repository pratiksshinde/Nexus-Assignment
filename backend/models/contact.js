const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Contact = sequelize.define(
  "Contact",
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
      validate: {
        notEmpty: true,
      },
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
      set(value) {
        if (!value) {
          this.setDataValue("email", null);
          return;
        }

        this.setDataValue("email", value.trim().toLowerCase());
      },
    },

    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
      set(value) {
        if (!value) {
          this.setDataValue("phone", null);
          return;
        }

        const normalizedPhone = String(value).replace(/\D/g, "");
        this.setDataValue("phone", normalizedPhone);
      },
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    custom_fields: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: "contacts",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        unique: true,
        fields: ["workspace_id", "email"],
        name: "contacts_workspace_email_unique",
      },
      {
        unique: true,
        fields: ["workspace_id", "phone"],
        name: "contacts_workspace_phone_unique",
      },
      {
        fields: ["workspace_id"],
      },
      {
        fields: ["workspace_id", "city"],
      },
    ],

    validate: {
      emailOrPhoneRequired() {
        if (!this.email && !this.phone) {
          throw new Error("A contact must have an email or phone number");
        }
      },
    },
  }
);

Contact.associate = (models) => {
  Contact.belongsTo(models.Workspace, {
    foreignKey: "workspace_id",
    as: "workspace",
  });

  Contact.belongsToMany(models.Tag, {
    through: models.ContactTag,
    foreignKey: "contact_id",
    otherKey: "tag_id",
    as: "tags",
  });

  Contact.hasMany(models.CampaignRecipient, {
    foreignKey: "contact_id",
    as: "campaignRecipients",
  });
};

module.exports = Contact;
