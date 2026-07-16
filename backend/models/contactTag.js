const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ContactTag = sequelize.define(
  "ContactTag",
  {
    contact_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "contacts",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    tag_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "tags",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "contact_tags",
    timestamps: true,
    underscored: true,
  }
);

ContactTag.associate = (models) => {
  ContactTag.belongsTo(models.Contact, {
    foreignKey: "contact_id",
    as: "contact",
  });

  ContactTag.belongsTo(models.Tag, {
    foreignKey: "tag_id",
    as: "tag",
  });
};

module.exports = ContactTag;