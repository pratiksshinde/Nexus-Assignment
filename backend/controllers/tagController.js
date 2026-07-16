const { Tag, Contact } = require("../models");

const createTag = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tag name is required",
      });
    }

    const normalizedName = name.trim();

    const [tag, created] = await Tag.findOrCreate({
      where: {
        workspace_id: req.user.workspace_id,
        name: normalizedName,
      },
      defaults: {
        workspace_id: req.user.workspace_id,
        name: normalizedName,
      },
    });

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created
        ? "Tag created successfully"
        : "Tag already exists",
      data: {
        tag,
      },
    });
  } catch (error) {
    console.error("Create tag error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create tag",
    });
  }
}

const getTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      where: {
        workspace_id: req.user.workspace_id,
      },
      include: [
        {
          model: Contact,
          as: "contacts",
          attributes: ["id"],
          through: {
            attributes: [],
          },
          required: false,
        },
      ],
      order: [["name", "ASC"]],
    });

    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      contact_count: tag.contacts.length,
      created_at: tag.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        tags: formattedTags,
      },
    });
  } catch (error) {
    console.error("Get tags error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tags",
    });
  }
}

const deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findOne({
      where: {
        id: req.params.id,
        workspace_id: req.user.workspace_id,
      },
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    await tag.destroy();

    return res.status(200).json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Delete tag error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete tag",
    });
  }
}

module.exports = {
  createTag,
  getTags,
  deleteTag,
};
