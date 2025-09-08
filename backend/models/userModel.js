const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please add the user name."],
    },
    email: {
      type: String,
      required: [true, "Please add the user's email address."],
      unique: [true, "Email Address Already Taken/Exist!"],
      // Menambahkan validasi format email
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add the user password."],
    },
    token: {
      type: String,
    },
    avatarPic: {
      type: String,
      required: [false],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
