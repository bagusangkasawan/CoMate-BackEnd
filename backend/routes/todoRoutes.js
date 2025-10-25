const express = require("express");
const {
  getTodo,
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
  addTodoToCalendar,
  moveTodoToTask, // Impor fungsi baru
} = require("../controllers/todoController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

router.use(validateToken);

router.route("/").get(getTodos).post(createTodo);

router.route("/:id").get(getTodo).put(updateTodo).delete(deleteTodo);

router.route("/:id/calendar").post(addTodoToCalendar);

// Rute baru untuk memindahkan To-Do
router.route("/:todoId/move/:taskId").put(moveTodoToTask);

module.exports = router;
