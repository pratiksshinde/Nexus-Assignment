const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Audience = sequelize.define(
  "Audience",
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

    filter_definition: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    tableName: "audiences",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        fields: ["workspace_id"],
      },
    ],
  }
);

Audience.associate = (models) => {
  Audience.belongsTo(models.Workspace, {
    foreignKey: "workspace_id",
    as: "workspace",
  });
};

module.exports = Audience;