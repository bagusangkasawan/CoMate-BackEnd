const mongoose = require("mongoose");

const todoSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    // FITUR BARU: Menambahkan referensi ke Task
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null, // null berarti To-Do ini tidak masuk dalam Task manapun
    },
    email: {
        type: String,
        required: [true, "Please add the user's email address."],
    },
    title: {
      type: String,
      required: [true, "Please add the todo title."],
    },
    description: { type: String },
    status: {
      type: String,
      required: [true, "Please select at least one status."],
      enum: ["To Do", "Pending", "Done"],
    },
    startDate: { type: String },
    endDate: { type: String },
    location: { type: String },
    attendee: { type: String }, // Bidang baru untuk attendee
    googleCalendarUrl: { type: String },
    googleCalendarId: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Todo", todoSchema);
