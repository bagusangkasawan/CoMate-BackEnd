const asyncHandler = require("express-async-handler");
const Task = require("../models/taskModel");
const Todo = require("../models/todoModel");
const User = require("../models/userModel"); // Diperlukan untuk invite
const Comment = require("../models/commentModel"); // Diperlukan untuk getTaskDetails

// @desc    Get all tasks for a user
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  // Diperbarui: Temukan task di mana user adalah anggota
  const tasks = await Task.find({ members: req.user.id }).sort({
    createdAt: "desc",
  });
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
    owner: req.user.id, // 'user_id' diubah menjadi 'owner'
    members: [req.user.id], // 'owner' otomatis menjadi member
    title,
  });

  res.status(201).json(task);
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  // Diperbarui: Hanya 'owner' yang dapat mengubah judul task
  const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });
  if (!task) {
    res.status(404);
    throw new Error("Task not found or user is not the owner.");
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
  // Diperbarui: Hanya 'owner' yang dapat menghapus task
  const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });
  if (!task) {
    res.status(404);
    throw new Error("Task not found or user is not the owner.");
  }

  // Hapus semua todos dan komentar yang terkait dengan task ini
  await Todo.deleteMany({ taskId: req.params.id });
  await Comment.deleteMany({ taskId: req.params.id });

  await Task.deleteOne({ _id: req.params.id });

  res.status(200).json({
    id: req.params.id,
    message: "Task, along with its todos and comments, has been deleted.",
  });
});

// @desc    Get full details for one task (todos, members, comments)
// @route   GET /api/tasks/:id/details
// @access  Private
const getTaskDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Dapatkan task dan populate members
  const task = await Task.findOne({
    _id: id,
    members: req.user.id, // Pastikan user adalah member
  }).populate("members", "username email"); // Ambil username & email member

  if (!task) {
    res.status(404);
    throw new Error("Task not found or user is not a member.");
  }

  // 2. Dapatkan todos untuk task ini
  const todos = await Todo.find({ taskId: id }).sort({ createdAt: "desc" });

  // 3. Dapatkan komentar untuk task ini
  const comments = await Comment.find({ taskId: id }).sort({ createdAt: "asc" });

  res.status(200).json({ task, todos, comments });
});

// @desc    Invite a user to a task
// @route   POST /api/tasks/:id/invite
// @access  Private (Premium)
const inviteMemberToTask = asyncHandler(async (req, res) => {
  // --- PREMIUM CHECK ---
  if (!req.user.isPremium) {
    res.status(403);
    throw new Error("Inviting members is a premium feature. Please upgrade.");
  }

  const { email } = req.body;
  const { id } = req.params; // Task ID

  if (!email) {
    res.status(400);
    throw new Error("Email is required to invite a user.");
  }

  // 1. Temukan task dan pastikan user saat ini adalah 'owner'
  const task = await Task.findOne({ _id: id, owner: req.user.id });
  if (!task) {
    res.status(403);
    throw new Error("Only the task owner can invite new members.");
  }

  // 2. Temukan user yang akan diundang
  const userToInvite = await User.findOne({ email });
  if (!userToInvite) {
    res.status(404);
    throw new Error("User with that email not found.");
  }

  // 3. Cek apakah user sudah menjadi member
  if (task.members.includes(userToInvite._id)) {
    res.status(400);
    throw new Error("User is already a member of this task.");
  }

  // 4. Tambahkan user ke 'members' dan simpan
  task.members.push(userToInvite._id);
  await task.save();

  const updatedTask = await Task.findById(id).populate("members", "username email");

  res.status(200).json({
    message: "User invited successfully.",
    task: updatedTask,
  });
});

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskDetails,
  inviteMemberToTask,
};
