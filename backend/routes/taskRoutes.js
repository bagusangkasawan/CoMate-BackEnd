const express = require("express");
const { getTasks, createTask, updateTask, deleteTask } = require("../controller/taskController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

// Apply token validation to all task routes
router.use(validateToken);

router.route("/").get(getTasks).post(createTask);

router.route("/:id").put(updateTask).delete(deleteTask);

module.exports = router;
