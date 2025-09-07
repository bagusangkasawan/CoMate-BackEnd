const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Todo = require("../models/todoModel");
const axios = require("axios");

const getTodos = asyncHandler(async (req, res) => {
  try {
    const todo = await Todo.find({ user_id: req.user.id });
    res.status(200).json({ message: "Get All Todo", todo });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const createTodo = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      status,
      description = "",
      startDate = "",
      endDate = "",
      location = "",
    } = req.body;

    if (!title || !status) {
      res.status(400);
      throw new Error("Fields 'title' and 'status' are mandatory.");
    }

    // Hapus logika kalender otomatis dari sini
    const todo = await Todo.create({
      user_id: req.user.id,
      title,
      description,
      status,
      startDate,
      endDate,
      location,
    });

    res.status(201).json({ message: "Todo created successfully", todo });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const getTodo = asyncHandler(async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: new ObjectId(req.params.id),
      user_id: req.user.id,
    });

    if (!todo) {
      res.status(404);
      throw new Error("Todo Not Found!");
    } else {
      res.status(200).json({ message: `Get Todo for ${req.params.id}`, todo });
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const updateTodo = asyncHandler(async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: new ObjectId(req.params.id),
      user_id: req.user.id,
    });

    if (!todo) {
      res.status(404);
      throw new Error("Todo Not Found!");
    }

    const {
      title,
      status,
      description = "",
      startDate = "",
      endDate = "",
      location = ""
    } = req.body;

    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        status,
        startDate,
        endDate,
        location
      },
      {
        new: true,
      }
    );

    res
      .status(200)
      .json({ message: `Update Todo for ${req.params.id}`, updatedTodo });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const deleteTodo = asyncHandler(async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: new ObjectId(req.params.id),
      user_id: req.user.id,
    });

    if (!todo) {
      res.status(404);
      throw new Error("Todo Not Found!");
    }

    await Todo.deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(200).json({ message: `Delete Todo for ${req.params.id}`, todo });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});


// Fungsi baru untuk integrasi kalender manual
const addTodoToCalendar = asyncHandler(async (req, res) => {
    const todo = await Todo.findOne({
        _id: new ObjectId(req.params.id),
        user_id: req.user.id,
    });

    if (!todo) {
        res.status(404);
        throw new Error("Todo not found");
    }

    if (!todo.startDate || !todo.endDate || !todo.title) {
        res.status(400);
        throw new Error("Todo must have a title, start date, and end date to be added to the calendar.");
    }
    
    try {
        const calendarPayload = {
            startDate: todo.startDate,
            endDate: todo.endDate,
            title: todo.title,
            description: todo.description || `Todo item: ${todo.title}`,
            location: todo.location || "",
            user: req.user.email,
        };
        
        const n8nWebhookTodos = process.env.N8N_WEBHOOK_TODOS;

        const calendarApiResponse = await axios.post(n8nWebhookTodos, calendarPayload);

        if (calendarApiResponse.data && calendarApiResponse.data[0] && calendarApiResponse.data[0].htmlLink) {
            todo.googleCalendarUrl = calendarApiResponse.data[0].htmlLink;
            const updatedTodo = await todo.save();
            res.status(200).json({ message: "Successfully added to calendar", todo: updatedTodo });
        } else {
            throw new Error("Invalid response from calendar service.");
        }
    } catch (calendarError) {
        console.error("Failed to create Google Calendar event:", calendarError.message);
        res.status(500);
        throw new Error("Failed to add event to Google Calendar.");
    }
});

module.exports = {
  getTodo,
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
  addTodoToCalendar, // Ekspor fungsi baru
};

