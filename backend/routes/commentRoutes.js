const express = require("express");
const router = express.Router();
const {
    getCommentsForTask,
    createComment,
    updateComment,
    deleteComment,
} = require("../controllers/commentController");
const validateToken = require("../middleware/validateTokenHandler");

// Terapkan middleware proteksi di semua rute
router.use(validateToken);

router.route("/:taskId").get(getCommentsForTask).post(createComment);
router
    .route("/:id")
    .put(updateComment)
    .delete(deleteComment);

module.exports = router;
