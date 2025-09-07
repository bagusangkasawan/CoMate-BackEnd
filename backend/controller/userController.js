// This is used as try-catch of the express async code
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400);
      throw new Error("All fields are Mandatory(username, email, password)");
    }

    const userAvailable = await User.findOne({ email });
    if (userAvailable) {
      res.status(400);
      throw new Error("User Already Registered!");
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const accessToken = jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user.id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "60m" }
    );

    await User.findOneAndUpdate({ email: user.email }, { token: accessToken });

    // If user created Successfully
    if (user) {
      res.status(201).json({
        message: "User Registered Successfully!",
        data: {
          _id: user.id,
          username: user.username,
          email: user.email,
          avatarPic: user.avatarPic || "",
          accessToken: accessToken,
        },
      });
    } else {
      res.status(400);
      throw new Error("User Data is not valid!");
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    // Memungkinkan login dengan username atau email
    const { login, password } = req.body;
    if (!login || !password) {
      res.status(400);
      throw new Error("All fields are Mandatory(login, password)");
    }

    const user = await User.findOne({
       $or: [{ email: login }, { username: login }] 
    });
    
    if (!user) {
      res.status(400);
      throw new Error("User Not Registered!");
    }

    // Compare password with Hashed Password
    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = jwt.sign(
        {
          user: {
            username: user.username,
            email: user.email,
            id: user.id,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "60m" }
      );

      await User.findOneAndUpdate(
        { email: user.email },
        { token: accessToken }
      );

      res
        .status(200)
        .json({ message: "User Logged In Successfully!", accessToken });
    } else {
      res.status(401);
      throw new Error("Login identifier or Password is not Valid!");
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const currentUser = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    res.json({
      message: "Current User Fetched Successfully!",
      data: {
        _id: user.id,
        username: user.username,
        email: user.email,
        avatarPic: user.avatarPic || "",
      },
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = {
  registerUser,
  loginUser,
  currentUser,
};
