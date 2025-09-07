const express = require("express");
const {
  getTodo,
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
  addTodoToCalendar, // Impor fungsi baru
} = require("../controller/todoController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

router.use(validateToken);

router.route("/").get(getTodos).post(createTodo);

router.route("/:id").get(getTodo).put(updateTodo).delete(deleteTodo);

// Rute baru untuk menambahkan todo ke Google Calendar
router.route("/:id/calendar").post(addTodoToCalendar);

module.exports = router;
