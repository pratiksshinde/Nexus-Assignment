const express = require("express");
const authenticate = require("../middlewares/authMiddleware");

const {
  createTag,
  getTags,
  deleteTag,
} = require("../controllers/tagController");

const router = express.Router();

router.use(authenticate);

router.post("/", createTag);
router.get("/", getTags);
router.delete("/:id", deleteTag);

module.exports = router;