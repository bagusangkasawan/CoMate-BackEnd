// This is used as try-catch of the express async code
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const validateToken = asyncHandler(async (req, res, next) => {
  try {
    let token;
    let authHeader = req.headers.Authorization || req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        asyncHandler(async (error, decoded) => {
          if (error) {
            res.status(401).send({ message: "User is not Authorized!" });
            return;
          }

          const email = decoded.user.email;
          const validUser = await User.findOne({ email, token });
          if (!validUser) {
            res.status(401).send({ message: "Invalid token!" });
            // throw new Error("Invalid token!");
            return;
          }

          req.user = validUser;
          next();
        })
      );

      if (!token) {
        res.status(401).send({ message: "User is not Authorized or Token is Missing!"});
        return;
      }
    } else {
      res.status(401).send({ message: "User is not Authorized or Token is Missing!"});
      return;
    }
  } catch (error) {
    res.status(400);
    throw new Error(error);
  }
});

module.exports = validateToken;
