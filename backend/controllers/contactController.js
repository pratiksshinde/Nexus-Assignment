const { Op } = require("sequelize");
const { sequelize, Contact, Tag } = require("../models");
const parseCsvBuffer = require("../utils/parseCsv");

const {
  normalizeEmail,
  normalizePhone,
  isValidEmail,
} = require("../utils/contactUtils");

const createContact = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      city,
      custom_fields = {},
    } = req.body;

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!normalizedEmail && !normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required",
      });
    }

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Email is invalid" });
    }

    if (typeof custom_fields !== "object" || Array.isArray(custom_fields)) {
      return res.status(400).json({ success: false, message: "Custom fields must be an object" });
    }

    const duplicateConditions = [];

    if (normalizedEmail) {
      duplicateConditions.push({
        email: normalizedEmail,
      });
    }

    if (normalizedPhone) {
      duplicateConditions.push({
        phone: normalizedPhone,
      });
    }

    const duplicateContact = await Contact.findOne({
      where: {
        workspace_id: req.user.workspace_id,
        [Op.or]: duplicateConditions,
      },
    });

    if (duplicateContact) {
      const duplicateField =
        duplicateContact.email === normalizedEmail
          ? "email"
          : "phone";

      return res.status(409).json({
        success: false,
        message: `A contact already exists with this ${duplicateField}`,
      });
    }

    const contact = await Contact.create({
      workspace_id: req.user.workspace_id,
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      city: city?.trim() || null,
      custom_fields,
    });

    return res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: {
        contact,
      },
    });
  } catch (error) {
    console.error("Create contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create contact",
    });
  }
}

const getContacts = async (req, res) => {
  try {
    const {
      search = "",
      city,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const offset = (pageNumber - 1) * limitNumber;

    const where = {
      workspace_id: req.user.workspace_id,
    };

    if (search) {
      where[Op.or] = [
        {
          name: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          email: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          phone: {
            [Op.iLike]: `%${search}%`,
          },
        },
      ];
    }

    if (city) {
      where.city = {
        [Op.iLike]: city,
      };
    }

    const { rows, count } = await Contact.findAndCountAll({
        where,
        include: [
            {
            model: Tag,
            as: "tags",
            attributes: ["id", "name"],
            through: {
                attributes: [],
            },
            required: false,
            },
        ],
        distinct: true,
        order: [["createdAt", "DESC"]],
        limit: limitNumber,
        offset,
        });

    return res.status(200).json({
      success: true,
      data: {
        contacts: rows,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: count,
          totalPages: Math.ceil(count / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Get contacts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
    });
  }
}

async function getContactById(req, res) {
  try {
    const contact = await Contact.findOne({
        where: {
            id: req.params.id,
            workspace_id: req.user.workspace_id,
        },
        include: [
            {
            model: Tag,
            as: "tags",
            attributes: ["id", "name"],
            through: {
                attributes: [],
            },
            },
        ],
        });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        contact,
      },
    });
  } catch (error) {
    console.error("Get contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact",
    });
  }
}

const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      where: {
        id: req.params.id,
        workspace_id: req.user.workspace_id,
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    const {
      name,
      email,
      phone,
      city,
      custom_fields,
    } = req.body;

    const normalizedEmail =
      email !== undefined
        ? normalizeEmail(email)
        : contact.email;

    const normalizedPhone =
      phone !== undefined
        ? normalizePhone(phone)
        : contact.phone;

    if (name !== undefined && !name?.trim()) {
      return res.status(400).json({ success: false, message: "Name cannot be empty" });
    }

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Email is invalid" });
    }

    if (custom_fields !== undefined && (typeof custom_fields !== "object" || Array.isArray(custom_fields))) {
      return res.status(400).json({ success: false, message: "Custom fields must be an object" });
    }

    if (!normalizedEmail && !normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required",
      });
    }

    const duplicateConditions = [];

    if (normalizedEmail) {
      duplicateConditions.push({
        email: normalizedEmail,
      });
    }

    if (normalizedPhone) {
      duplicateConditions.push({
        phone: normalizedPhone,
      });
    }

    if (duplicateConditions.length > 0) {
      const duplicateContact = await Contact.findOne({
        where: {
          workspace_id: req.user.workspace_id,
          id: {
            [Op.ne]: contact.id,
          },
          [Op.or]: duplicateConditions,
        },
      });

      if (duplicateContact) {
        return res.status(409).json({
          success: false,
          message:
            "Another contact already uses this email or phone",
        });
      }
    }

    await contact.update({
      name: name !== undefined ? name.trim() : contact.name,
      email: normalizedEmail,
      phone: normalizedPhone,
      city:
        city !== undefined
          ? city?.trim() || null
          : contact.city,
      custom_fields:
        custom_fields !== undefined
          ? custom_fields
          : contact.custom_fields,
    });

    return res.status(200).json({
      success: true,
      message: "Contact updated successfully",
      data: {
        contact,
      },
    });
  } catch (error) {
    console.error("Update contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update contact",
    });
  }
}

const deleteContact = async(req, res) => {
  try {
    const contact = await Contact.findOne({
      where: {
        id: req.params.id,
        workspace_id: req.user.workspace_id,
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    await contact.destroy();

    return res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Delete contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete contact",
    });
  }
}


const importContacts = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "CSV file is required",
    });
  }

  let transaction;

  try {
    const rows = await parseCsvBuffer(req.file.buffer);

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "CSV file is empty",
      });
    }

    if (rows.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "CSV cannot contain more than 1000 contacts",
      });
    }

    const workspaceId = req.user.workspace_id;

    const existingContacts = await Contact.findAll({
      where: {
        workspace_id: workspaceId,
      },
      attributes: ["email", "phone"],
      raw: true,
    });

    const usedEmails = new Set(
      existingContacts
        .map((contact) => contact.email)
        .filter(Boolean)
    );

    const usedPhones = new Set(
      existingContacts
        .map((contact) => contact.phone)
        .filter(Boolean)
    );

    const standardFields = new Set([
      "name",
      "email",
      "phone",
      "city",
      "tags",
    ]);

    const validContacts = [];
    const skippedRows = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2; // Header is row 1

      const name = row.name?.trim();
      const email = normalizeEmail(row.email);
      const phone = normalizePhone(row.phone);
      const city = row.city?.trim() || null;

      if (!name) {
        skippedRows.push({
          row: rowNumber,
          reason: "Name is missing",
        });

        continue;
      }

      if (!email && !phone) {
        skippedRows.push({
          row: rowNumber,
          reason: "Email and phone are both missing",
        });

        continue;
      }

      if (email && !isValidEmail(email)) {
        skippedRows.push({
          row: rowNumber,
          reason: "Invalid email address",
          value: email,
        });

        continue;
      }

      if (email && usedEmails.has(email)) {
        skippedRows.push({
          row: rowNumber,
          reason: "Duplicate email",
          value: email,
        });

        continue;
      }

      if (phone && usedPhones.has(phone)) {
        skippedRows.push({
          row: rowNumber,
          reason: "Duplicate phone",
          value: phone,
        });

        continue;
      }

      const customFields = {};

      for (const [key, value] of Object.entries(row)) {
        if (!standardFields.has(key) && value !== "") {
          customFields[key] = String(value).trim();
        }
      }

      const tags = row.tags
        ? String(row.tags)
            .split(/[;,|]/)
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      validContacts.push({
        workspace_id: workspaceId,
        name,
        email,
        phone,
        city,
        custom_fields: customFields,
        tags,
      });

      // This also catches duplicates inside the same CSV.
      if (email) usedEmails.add(email);
      if (phone) usedPhones.add(phone);
    }

    transaction = await sequelize.transaction();

    const createdContacts = [];

    for (const contactData of validContacts) {
      const { tags, ...contactValues } = contactData;

      const contact = await Contact.create(contactValues, {
        transaction,
      });

      if (tags.length) {
        const tagInstances = [];

        for (const tagName of tags) {
          const [tag] = await Tag.findOrCreate({
            where: {
              workspace_id: workspaceId,
              name: tagName,
            },
            defaults: {
              workspace_id: workspaceId,
              name: tagName,
            },
            transaction,
          });

          tagInstances.push(tag);
        }

        await contact.setTags(tagInstances, {
          transaction,
        });
      }

      createdContacts.push(contact);
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Contact import completed",
      data: {
        totalRows: rows.length,
        added: createdContacts.length,
        skipped: skippedRows.length,
        skippedRows,
      },
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error("CSV import error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to import contacts",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
}

const updateContactTags = async (req, res) => {
  try {
    const { tag_ids = [] } = req.body;

    if (!Array.isArray(tag_ids)) {
      return res.status(400).json({
        success: false,
        message: "tag_ids must be an array",
      });
    }

    const contact = await Contact.findOne({
      where: {
        id: req.params.id,
        workspace_id: req.user.workspace_id,
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    const uniqueTagIds = [...new Set(tag_ids.map(Number))];
    const tags = await Tag.findAll({
      where: {
        id: uniqueTagIds,
        workspace_id: req.user.workspace_id,
      },
    });

    if (tags.length !== uniqueTagIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more tags are invalid",
      });
    }

    await contact.setTags(tags);

    const updatedContact = await Contact.findOne({
      where: {
        id: contact.id,
        workspace_id: req.user.workspace_id,
      },
      include: [
        {
          model: Tag,
          as: "tags",
          attributes: ["id", "name"],
          through: {
            attributes: [],
          },
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Contact tags updated",
      data: {
        contact: updatedContact,
      },
    });
  } catch (error) {
    console.error("Update contact tags error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update contact tags",
    });
  }
}

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  importContacts,
  updateContactTags,
};
