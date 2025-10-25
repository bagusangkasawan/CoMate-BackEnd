const express = require("express");
const {
  registerUser,
  loginUser,
  currentUser,
  updateUser,
  subscribeUser, // Impor fungsi baru
} = require("../controllers/userController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Rute baru untuk upgrade ke premium
router.post("/subscribe", validateToken, subscribeUser);

// Gabungkan GET dan PUT untuk endpoint /current
router
  .route("/current")
  .get(validateToken, currentUser)
  .put(validateToken, updateUser);

module.exports = router;
