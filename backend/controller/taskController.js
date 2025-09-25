const asyncHandler = require("express-async-handler");
const Task = require("../models/taskModel");
const Todo = require("../models/todoModel");

// @desc    Get all tasks for a user
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ user_id: req.user.id }).sort({ createdAt: 'desc' });
  res.status(200).json(tasks);
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) {
    res.status(400);
    throw new Error("Title is required for a task.");
  }

  const task = await Task.create({
    user_id: req.user.id,
    title,
  });

  res.status(201).json(task);
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user_id: req.user.id });
  if (!task) {
    res.status(404);
    throw new Error("Task not found.");
  }

  const { title } = req.body;
  if (!title) {
    res.status(400);
    throw new Error("Title is required.");
  }

  task.title = title;
  const updatedTask = await task.save();

  res.status(200).json(updatedTask);
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user_id: req.user.id });
  if (!task) {
    res.status(404);
    throw new Error("Task not found.");
  }

  // Set taskId to null for all todos in this task, making them uncategorized
  await Todo.updateMany({ taskId: req.params.id }, { $set: { taskId: null } });

  await Task.deleteOne({ _id: req.params.id });

  res.status(200).json({ id: req.params.id, message: "Task deleted. Todos within are now uncategorized." });
});

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
