const express = require("express");
const { chatWithBot } = require("../controller/chatController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

// Middleware untuk melindungi semua rute di bawah ini
router.use(validateToken);

router.route("/").post(chatWithBot);

module.exports = router;
