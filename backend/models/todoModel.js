const mongoose = require("mongoose");

const todoSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Please add the todo title."],
    },
    description: {
      type: String,
      required: [false],
    },
    status: {
      type: String,
      required: [true, "Please select at least one status."],
      enum: ["To Do", "Pending", "Done"],
    },
    startDate: { // Diubah dari dueDate
      type: String,
      required: [false],
    },
    endDate: { // Diubah dari reminderDate
      type: String,
      required: [false],
    },
    location: { // Bidang baru
      type: String,
      required: false,
    },
    googleCalendarUrl: { // Bidang baru untuk link Google Calendar
      type: String,
      required: [false],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Todo", todoSchema);
