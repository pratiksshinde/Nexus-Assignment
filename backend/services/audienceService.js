const { Op } = require("sequelize");
const { Contact, Tag } = require("../models");

const buildAudienceQuery = (filterDefinition, workspaceId) => {
  const { type, operator = "equals", value, field } = filterDefinition;

  const where = {
    workspace_id: workspaceId,
  };

  const include = [];

  if (type === "city") {
    if (operator === "equals") {
      where.city = {
        [Op.iLike]: value,
      };
    }

    if (operator === "contains") {
      where.city = {
        [Op.iLike]: `%${value}%`,
      };
    }
  }

  if (type === "tag") {
    include.push({
      model: Tag,
      as: "tags",
      where: {
        id: Number(value),
        workspace_id: workspaceId,
      },
      attributes: ["id", "name"],
      through: {
        attributes: [],
      },
      required: true,
    });
  }

  if (type === "custom_field") {
    where.custom_fields = {
      [Op.contains]: {
        [field]: value,
      },
    };
  }

  return {
    where,
    include,
  };
}

const resolveAudienceContacts = (audience, workspaceId) => {
  const query = buildAudienceQuery(
    audience.filter_definition,
    workspaceId
  );

  return Contact.findAll({
    ...query,
    distinct: true,
    order: [["createdAt", "DESC"]],
  });
}

const countAudienceContacts = (audience, workspaceId) => {
  const query = buildAudienceQuery(
    audience.filter_definition,
    workspaceId
  );

  return Contact.count({
    ...query,
    distinct: true,
    col: "id",
  });
}

module.exports = {
  buildAudienceQuery,
  resolveAudienceContacts,
  countAudienceContacts,
};
