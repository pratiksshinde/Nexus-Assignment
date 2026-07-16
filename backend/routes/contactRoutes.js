const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const authenticate = require("../middlewares/authMiddleware");

const {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  importContacts,
  updateContactTags
} = require("../controllers/contactController");

const router = express.Router();

router.use(authenticate);

router.post("/import", upload.single("file"), importContacts);

router.post("/", createContact);
router.get("/", getContacts);

router.put("/:id/tags", updateContactTags);

router.get("/:id", getContactById);
router.patch("/:id", updateContact);
router.delete("/:id", deleteContact);

module.exports = router;