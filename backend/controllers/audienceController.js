const { sequelize, Audience, Tag } = require("../models");
const {
  countAudienceContacts,
  resolveAudienceContacts,
} = require("../services/audienceService");

const allowedTypes = ["city", "tag", "custom_field"];
const allowedOperators = ["equals", "contains"];

const validateFilter = (filterDefinition) => {
  if (!filterDefinition || typeof filterDefinition !== "object") {
    return "Filter definition is required";
  }

  const { type, operator, value, field } = filterDefinition;

  if (!allowedTypes.includes(type)) {
    return "Invalid filter type";
  }

  if (!allowedOperators.includes(operator)) {
    return "Invalid filter operator";
  }

  if (value === undefined || value === null || value === "") {
    return "Filter value is required";
  }

  if (type === "custom_field" && !field) {
    return "Custom field name is required";
  }

  if (type === "tag" && operator !== "equals") {
    return "Tag filter only supports equals";
  }

  if (type === "custom_field" && operator !== "equals") {
    return "Custom field filters only support equals";
  }

  return null;
}

const createAudience = async (req, res) => {
  try {
    const { name, filter_definition } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Audience name is required",
      });
    }

    const filterError = validateFilter(filter_definition);

    if (filterError) {
      return res.status(400).json({
        success: false,
        message: filterError,
      });
    }

    if (filter_definition.type === "tag") {
      const tag = await Tag.findOne({
        where: {
          id: filter_definition.value,
          workspace_id: req.user.workspace_id,
        },
      });

      if (!tag) {
        return res.status(400).json({
          success: false,
          message: "Selected tag does not exist",
        });
      }
    }

    const { audience, contactCount } = await sequelize.transaction(async (transaction) => {
      const createdAudience = await Audience.create({
        workspace_id: req.user.workspace_id,
        name: name.trim(),
        filter_definition,
      }, { transaction });
      const count = await countAudienceContacts(createdAudience, req.user.workspace_id);
      return { audience: createdAudience, contactCount: count };
    });

    return res.status(201).json({
      success: true,
      message: "Audience created successfully",
      data: {
        audience: {
          ...audience.toJSON(),
          contact_count: contactCount,
        },
      },
    });
  } catch (error) {
    console.error("Create audience error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create audience",
    });
  }
}

const getAudiences = async (req, res) => {
  try {
    const audiences = await Audience.findAll({
      where: {
        workspace_id: req.user.workspace_id,
      },
      order: [["createdAt", "DESC"]],
    });

    const audiencesWithCounts = await Promise.all(
      audiences.map(async (audience) => {
        const contactCount = await countAudienceContacts(
          audience,
          req.user.workspace_id
        );

        return {
          ...audience.toJSON(),
          contact_count: contactCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        audiences: audiencesWithCounts,
      },
    });
  } catch (error) {
    console.error("Get audiences error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audiences",
    });
  }
}

const getAudienceById = async (req, res) => {
  try {
    const audience = await Audience.findOne({
      where: {
        id: req.params.id,
        workspace_id: req.user.workspace_id,
      },
    });

    if (!audience) {
      return res.status(404).json({
        success: false,
        message: "Audience not found",
      });
    }

    const contacts = await resolveAudienceContacts(
      audience,
      req.user.workspace_id
    );

    return res.status(200).json({
      success: true,
      data: {
        audience: {
          ...audience.toJSON(),
          contact_count: contacts.length,
        },
        contacts,
      },
    });
  } catch (error) {
    console.error("Get audience error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audience",
    });
  }
}

const updateAudience = async (req, res) => {
  try {
    const audience = await Audience.findOne({
      where: {
        id: req.params.id,
        workspace_id: req.user.workspace_id,
      },
    });

    if (!audience) {
      return res.status(404).json({
        success: false,
        message: "Audience not found",
      });
    }

    const { name, filter_definition } = req.body;

    if (name !== undefined && !name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Audience name cannot be empty",
      });
    }

    if (filter_definition !== undefined) {
      const filterError = validateFilter(filter_definition);

      if (filterError) {
        return res.status(400).json({
          success: false,
          message: filterError,
        });
      }

      if (filter_definition.type === "tag") {
        const tag = await Tag.findOne({
          where: {
            id: filter_definition.value,
            workspace_id: req.user.workspace_id,
          },
        });

        if (!tag) {
          return res.status(400).json({
            success: false,
            message: "Selected tag does not exist",
          });
        }
      }
    }

    await audience.update({
      name:
        name !== undefined
          ? name.trim()
          : audience.name,

      filter_definition:
        filter_definition !== undefined
          ? filter_definition
          : audience.filter_definition,
    });

    const contactCount = await countAudienceContacts(
      audience,
      req.user.workspace_id
    );

    return res.status(200).json({
      success: true,
      message: "Audience updated successfully",
      data: {
        audience: {
          ...audience.toJSON(),
          contact_count: contactCount,
        },
      },
    });
  } catch (error) {
    console.error("Update audience error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update audience",
    });
  }
}

const deleteAudience = async (req, res) => {
  try {
    const audience = await Audience.findOne({
      where: {
        id: req.params.id,
        workspace_id: req.user.workspace_id,
      },
    });

    if (!audience) {
      return res.status(404).json({
        success: false,
        message: "Audience not found",
      });
    }

    await audience.destroy();

    return res.status(200).json({
      success: true,
      message: "Audience deleted successfully",
    });
  } catch (error) {
    console.error("Delete audience error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete audience",
    });
  }
}

const previewAudience = async (req, res) => {
  try {
    const { filter_definition } = req.body;

    const filterError = validateFilter(filter_definition);

    if (filterError) {
      return res.status(400).json({
        success: false,
        message: filterError,
      });
    }

    const temporaryAudience = {
      filter_definition,
    };

    const contacts = await resolveAudienceContacts(
      temporaryAudience,
      req.user.workspace_id
    );

    return res.status(200).json({
      success: true,
      data: {
        contact_count: contacts.length,
        contacts: contacts.slice(0, 20),
      },
    });
  } catch (error) {
    console.error("Preview audience error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to preview audience",
    });
  }
}

module.exports = {
  createAudience,
  getAudiences,
  getAudienceById,
  updateAudience,
  deleteAudience,
  previewAudience,
};
