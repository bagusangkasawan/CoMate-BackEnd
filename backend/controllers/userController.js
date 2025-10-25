const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Fungsi registerUser tetap sama
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // PERUBAHAN: Menambahkan isPremium ke token JWT
    const accessToken = jwt.sign({ user: { username: user.username, email: user.email, id: user.id, isPremium: user.isPremium }, }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "60m" } );
    await User.findOneAndUpdate({ email: user.email }, { token: accessToken });

    if (user) {
      res.status(201).json({
        message: "User Registered Successfully!",
        data: { _id: user.id, username: user.username, email: user.email, avatarPic: user.avatarPic || "", accessToken: accessToken, },
      });
    } else {
      res.status(400);
      throw new Error("User Data is not valid!");
    }
  } catch (error) {
    res.status(400);
    throw new Error(error);
  }
});

// Fungsi loginUser tetap sama
const loginUser = asyncHandler(async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      res.status(400);
      throw new Error("All fields are Mandatory(login, password)");
    }
    const user = await User.findOne({ $or: [{ email: login }, { username: login }], });
    if (!user) {
      res.status(400);
      throw new Error("User Not Registered!");
    }
    if (user && (await bcrypt.compare(password, user.password))) {
      // PERUBAHAN: Menambahkan isPremium ke token JWT
      const accessToken = jwt.sign({ user: { username: user.username, email: user.email, id: user.id, isPremium: user.isPremium }, }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "60m" } );
      await User.findOneAndUpdate( { email: user.email }, { token: accessToken } );
      res.status(200).json({ message: "User Logged In Successfully!", accessToken });
    } else {
      res.status(401);
      throw new Error("Email or Password is not Valid!");
    }
  } catch (error) {
    res.status(400);
    throw new Error(error);
  }
});

// FUNGSI DIPERBARUI: Mengambil data user termasuk status premium
const currentUser = asyncHandler(async (req, res) => {
  try {
    // req.user sekarang berasal dari token (validateTokenHandler)
    // dan sudah berisi isPremium
    res.json({ 
        message: "Current User Fetched Successfully!", 
        data: { 
            _id: req.user.id, 
            username: req.user.username, 
            email: req.user.email, 
            isPremium: req.user.isPremium // Mengirim status premium ke frontend
        }, 
    });
  } catch (error) {
    res.status(400);
    throw new Error(error);
  }
});

// FUNGSI DIPERBARUI: Update User Profile
const updateUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Update email jika ada dan berbeda
  if (email && user.email !== email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== user._id.toString()) {
          res.status(400);
          throw new Error("Email already taken");
      }
      user.email = email;
  }

  // Update username jika ada
  if (username) {
    user.username = username;
  }

  // Update password jika ada
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
  }

  try {
    const updatedUser = await user.save();
    res.status(200).json({
      message: "User profile updated successfully!",
      data: {
        _id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isPremium: updatedUser.isPremium, // Kirim status terbaru
      },
    });
  } catch (error) {
      res.status(400);
      throw new Error(error.message);
  }
});

// FITUR BARU: Fungsi untuk subscribe premium menggunakan voucher
const subscribeUser = asyncHandler(async (req, res) => {
    const { voucher } = req.body;
    const VOUCHER_CODE = process.env.PREMIUM_VOUCHER || "PREMIUM100";

    if (!voucher || voucher.trim().toUpperCase() !== VOUCHER_CODE) {
        res.status(400);
        throw new Error("Invalid voucher code.");
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    if (user.isPremium) {
        res.status(400);
        throw new Error("You are already a premium member.");
    }

    user.isPremium = true;
    await user.save();

    res.status(200).json({
        message: "Subscription successful! You are now a premium member.",
        data: { isPremium: user.isPremium }
    });
});


module.exports = {
  registerUser,
  loginUser,
  currentUser,
  updateUser,
  subscribeUser, // export fungsi baru
};
