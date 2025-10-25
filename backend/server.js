const express = require("express");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");
const connectDb = require("./config/dbConnection");
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require("dotenv").config();

connectDb();
const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "https://cdn.jsdelivr.net"], 
        "style-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"], 
        "img-src": ["'self'", "data:", "https://images.unsplash.com"], 
        "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"], 
        "connect-src": ["'self'", "https://cdn.jsdelivr.net"], 
      },
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use(express.static('public'));

app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/todo", require("./routes/todoRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/chat", require("./routes/chatRoutes")); 
app.use("/api/comments", require("./routes/commentRoutes")); // Rute baru untuk komentar

app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
});
