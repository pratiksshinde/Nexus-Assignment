const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Workspace = sequelize.define(
  "Workspace",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    tableName: "workspaces",
    timestamps: true,
    underscored: true,
  }
);

Workspace.associate = (models) => {
  Workspace.hasMany(models.User, {
    foreignKey: "workspace_id",
    as: "users",
    onDelete: "CASCADE",
  });

  Workspace.hasMany(models.Contact, {
    foreignKey: "workspace_id",
    as: "contacts",
    onDelete: "CASCADE",
  });

  Workspace.hasMany(models.Tag, {
    foreignKey: "workspace_id",
    as: "tags",
    onDelete: "CASCADE",
  });

  Workspace.hasMany(models.Audience, {
    foreignKey: "workspace_id",
    as: "audiences",
    onDelete: "CASCADE",
  });

  Workspace.hasMany(models.Campaign, {
    foreignKey: "workspace_id",
    as: "campaigns",
    onDelete: "CASCADE",
  });
};

module.exports = Workspace;