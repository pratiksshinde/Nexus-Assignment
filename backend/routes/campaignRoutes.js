const router = require("express").Router();
const authenticate = require("../middlewares/authMiddleware");
const controller = require("../controllers/campaignController");

router.use(authenticate);
router.post("/recipients/preview", controller.previewRecipients);
router.post("/", controller.createCampaign);
router.get("/", controller.getCampaigns);
router.get("/:id", controller.getCampaign);
router.patch("/:id", controller.updateCampaign);
router.post("/:id/send", controller.sendCampaign);

module.exports = router;
