const { Op } = require("sequelize");
const { Audience, Contact, Tag } = require("../models");
const { resolveAudienceContacts } = require("./audienceService");
const { normalizeEmail, normalizePhone } = require("../utils/contactUtils");

const previewManualRecipients = async (identifiers, workspaceId) => {
  const uniqueInputs = [...new Set(identifiers.map((value) => String(value).trim()).filter(Boolean))];
  const normalized = uniqueInputs.map((input) => ({
    input,
    email: input.includes("@") ? normalizeEmail(input) : null,
    phone: input.includes("@") ? null : normalizePhone(input),
  }));
  const conditions = normalized.flatMap(({ email, phone }) => [
    ...(email ? [{ email }] : []),
    ...(phone ? [{ phone }] : []),
  ]);
  const contacts = conditions.length
    ? await Contact.findAll({ where: { workspace_id: workspaceId, [Op.or]: conditions } })
    : [];

  return normalized.map(({ input, email, phone }) => {
    const contact = contacts.find((item) =>
      (email && item.email === email) || (phone && item.phone === phone));
    return {
      input,
      matched: Boolean(contact),
      sendable: Boolean(contact?.email),
      contact: contact ? { id: contact.id, name: contact.name, email: contact.email, phone: contact.phone } : null,
    };
  });
};

const resolveSource = async (source, sourceData, workspaceId) => {
  if (source === "manual") {
    if (!Array.isArray(sourceData.identifiers)) throw new Error("Manual recipients are required");
    return previewManualRecipients(sourceData.identifiers, workspaceId);
  }

  if (source === "audience") {
    const audience = await Audience.findOne({ where: { id: sourceData.id, workspace_id: workspaceId } });
    if (!audience) throw new Error("Audience not found");
    const contacts = await resolveAudienceContacts(audience, workspaceId);
    return contacts.map((contact) => ({
      input: contact.email || contact.phone,
      matched: true,
      sendable: Boolean(contact.email),
      contact,
    }));
  }

  if (source === "tag") {
    const tag = await Tag.findOne({ where: { id: sourceData.id, workspace_id: workspaceId } });
    if (!tag) throw new Error("Tag not found");
    const contacts = await Contact.findAll({
      where: { workspace_id: workspaceId },
      include: [{ model: Tag, as: "tags", where: { id: tag.id }, attributes: [], through: { attributes: [] } }],
    });
    return contacts.map((contact) => ({
      input: contact.email || contact.phone,
      matched: true,
      sendable: Boolean(contact.email),
      contact,
    }));
  }

  throw new Error("Invalid recipient source");
};

module.exports = { previewManualRecipients, resolveSource };
