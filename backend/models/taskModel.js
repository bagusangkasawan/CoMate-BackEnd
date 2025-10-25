const mongoose = require("mongoose");

const taskSchema = mongoose.Schema(
  {
    // 'user_id' diubah namanya menjadi 'owner'
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    // FITUR BARU: Kolaborasi
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    title: {
      type: String,
      required: [true, "Please add the task title."],
    },
  },
  {
    timestamps: true,
  }
);

// Pastikan 'members' selalu memiliki 'owner' di dalamnya
taskSchema.pre("save", function (next) {
  if (this.isNew) {
    if (!this.members.includes(this.owner)) {
      this.members.push(this.owner);
    }
  }
  next();
});

module.exports = mongoose.model("Task", taskSchema);
