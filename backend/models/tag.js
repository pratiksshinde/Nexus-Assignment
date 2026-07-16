const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Tag = sequelize.define(
  "Tag",
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
      type: DataTypes.STRING(80),
      allowNull: false,
      set(value) {
        this.setDataValue("name", value.trim());
      },
    },
  },
  {
    tableName: "tags",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        unique: true,
        fields: ["workspace_id", "name"],
        name: "tags_workspace_name_unique",
      },
    ],
  }
);

Tag.associate = (models) => {
  Tag.belongsTo(models.Workspace, {
    foreignKey: "workspace_id",
    as: "workspace",
  });

  Tag.belongsToMany(models.Contact, {
    through: models.ContactTag,
    foreignKey: "tag_id",
    otherKey: "contact_id",
    as: "contacts",
  });
};

module.exports = Tag;