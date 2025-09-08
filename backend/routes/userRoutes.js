const express = require("express");
const {
  registerUser,
  loginUser,
  currentUser,
  updateUser, // Impor fungsi baru
} = require("../controller/userController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Gabungkan GET dan PUT untuk endpoint /current
router
  .route("/current")
  .get(validateToken, currentUser)
  .put(validateToken, updateUser);

module.exports = router;

