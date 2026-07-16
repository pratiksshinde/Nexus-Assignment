const express = require("express");
const authenticate = require("../middlewares/authMiddleware");

const {
  createAudience,
  getAudiences,
  getAudienceById,
  updateAudience,
  deleteAudience,
  previewAudience,
} = require("../controllers/audienceController");

const router = express.Router();

router.use(authenticate);

router.post("/preview", previewAudience);

router.post("/", createAudience);
router.get("/", getAudiences);
router.get("/:id", getAudienceById);
router.patch("/:id", updateAudience);
router.delete("/:id", deleteAudience);

module.exports = router;