const mongoose = require("mongoose");

const commentSchema = mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Task",
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        // Menyimpan username untuk kemudahan tampilan, mengurangi lookup
        username: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: [true, "Comment content cannot be empty."],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Comment", commentSchema);
