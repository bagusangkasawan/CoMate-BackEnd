const express = require("express");
const router = express.Router();
const {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    inviteMemberToTask, // Impor fungsi baru
    getTaskDetails, // Impor fungsi baru
} = require("../controllers/taskController");
const validateToken = require("../middleware/validateTokenHandler");

// Terapkan middleware proteksi di semua rute
router.use(validateToken);

router.route("/").get(getTasks).post(createTask);

router.route("/:id").put(updateTask).delete(deleteTask);

// Rute baru untuk detail dan kolaborasi
router.route("/:id/details").get(getTaskDetails);
router.route("/:id/invite").post(inviteMemberToTask);

module.exports = router;
