const asyncHandler = require("express-async-handler");
const Comment = require("../models/commentModel");
const Task = require("../models/taskModel");

// @desc    Get all comments for a task
// @route   GET /api/comments/:taskId
// @access  Private
const getCommentsForTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    // Pastikan user adalah anggota task sebelum melihat komentar
    const task = await Task.findOne({
        _id: taskId,
        members: req.user.id,
    });

    if (!task) {
        res.status(404);
        throw new Error("Task not found or user not a member.");
    }

    const comments = await Comment.find({ taskId: taskId }).sort({ createdAt: "asc" });
    res.status(200).json(comments);
});

// @desc    Create a new comment
// @route   POST /api/comments/:taskId
// @access  Private (Premium)
const createComment = asyncHandler(async (req, res) => {
    // --- PREMIUM CHECK ---
    if (!req.user.isPremium) {
        res.status(403);
        throw new Error("Adding comments is a premium feature. Please upgrade.");
    }

    const { taskId } = req.params;
    const { content } = req.body;

    if (!content) {
        res.status(400);
        throw new Error("Comment content is required.");
    }

    // Pastikan user adalah anggota task
    const task = await Task.findOne({
        _id: taskId,
        members: req.user.id,
    });

    if (!task) {
        res.status(404);
        throw new Error("Task not found or user not a member.");
    }

    const comment = await Comment.create({
        taskId,
        user_id: req.user.id,
        username: req.user.username,
        content,
    });

    res.status(201).json(comment);
});

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        res.status(404);
        throw new Error("Comment not found.");
    }

    // Security: Hanya pemilik komentar yang bisa mengedit
    if (comment.user_id.toString() !== req.user.id) {
        res.status(403);
        throw new Error("User doesn't have permission to edit this comment.");
    }

    if (!content) {
        res.status(400);
        throw new Error("Comment content cannot be empty.");
    }

    comment.content = content;
    const updatedComment = await comment.save();

    res.status(200).json(updatedComment);
});


// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        res.status(404);
        throw new Error("Comment not found.");
    }

    // Temukan task terkait untuk memeriksa kepemilikan
    const task = await Task.findById(comment.taskId);

    // User dapat menghapus jika mereka adalah:
    // 1. Pembuat komentar
    // 2. Pemilik task
    if (
        comment.user_id.toString() !== req.user.id &&
        task.owner.toString() !== req.user.id
    ) {
        res.status(403);
        throw new Error("User doesn't have permission to delete this comment.");
    }

    await Comment.deleteOne({ _id: req.params.id });
    res.status(200).json({ id: req.params.id, message: "Comment deleted." });
});

module.exports = {
    getCommentsForTask,
    createComment,
    updateComment,
    deleteComment,
};
