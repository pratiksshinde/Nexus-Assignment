const router = require("express").Router();
const { brevoWebhook } = require("../controllers/webhookController");

router.post("/brevo", brevoWebhook);

module.exports = router;
