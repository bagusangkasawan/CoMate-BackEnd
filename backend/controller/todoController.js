const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Todo = require("../models/todoModel");
const Task = require("../models/taskModel");
const User = require("../models/userModel");
const axios = require('axios');

const n8nTodosUrl = process.env.N8N_WEBHOOK_TODOS;

const getTodos = asyncHandler(async (req, res) => {
  try {
    const todo = await Todo.find({ user_id: req.user.id }).sort({ createdAt: 'desc' });
    res.status(200).json({ message: "Get All Todo", todo });
  } catch (error) {
    res.status(400);
    throw new Error(error);
  }
});

// FUNGSI DIPERBARUI: Validasi batas To-Do untuk pengguna non-premium
const createTodo = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const todoCount = await Todo.countDocuments({ user_id: req.user.id });

  if (!user.isPremium && todoCount >= 10) {
    res.status(403); // Forbidden
    throw new Error("You have reached the 10 todo limit for free accounts. Please subscribe to add more.");
  }

  const { title, status, description, startDate, endDate, location, attendee, taskId } = req.body;
  if (!title || !status) {
    res.status(400);
    throw new Error("All fields are Mandatory(title, status)");
  }
  const todo = await Todo.create({
    user_id: req.user.id,
    email: req.user.email,
    title, description, status, startDate, endDate, location, attendee,
    taskId: taskId || null,
  });
  res.status(201).json({ message: "Todo created successfully", todo });
});

const getTodo = asyncHandler(async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: new ObjectId(req.params.id), user_id: req.user.id, });
    if (!todo) {
      res.status(404);
      throw new Error("Todo Not Found!");
    } else {
      res.status(200).json({ message: `Get Todo for ${req.params.id}`, todo });
    }
  } catch (error) {
    res.status(400);
    throw new Error(error);
  }
});

const updateTodo = asyncHandler(async (req, res) => {
    const todo = await Todo.findOne({ _id: new ObjectId(req.params.id), user_id: req.user.id });
    if (!todo) {
        res.status(404);
        throw new Error("Todo Not Found!");
    }
    
    if (todo.googleCalendarId && (req.body.startDate !== todo.startDate || req.body.endDate !== todo.endDate)) {
        res.status(400);
        throw new Error("Start date and end date cannot be changed for events already in the calendar.");
    }

    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (updatedTodo.googleCalendarId) {
        try {
            const calendarUpdateUrl = `${n8nTodosUrl}-update`;
            const payload = {
                id: updatedTodo.googleCalendarId,
                title: updatedTodo.title,
                description: updatedTodo.description || '',
                location: updatedTodo.location || '',
                attendee: updatedTodo.attendee || '',
            };
            await axios.post(calendarUpdateUrl, payload);
        } catch (error) {
            console.error("Failed to update Google Calendar event:", error.message);
        }
    }

    res.status(200).json({ message: `Update Todo for ${req.params.id}`, updatedTodo });
});

const deleteTodo = asyncHandler(async (req, res) => {
    const todo = await Todo.findOne({ _id: new ObjectId(req.params.id), user_id: req.user.id });
    if (!todo) {
        res.status(404);
        throw new Error("Todo Not Found!");
    }

    if (todo.googleCalendarId) {
        try {
            const calendarDeleteUrl = `${n8nTodosUrl}-delete`;
            await axios.post(calendarDeleteUrl, { id: todo.googleCalendarId });
        } catch (error) {
            console.error("Failed to delete Google Calendar event:", error.message);
        }
    }

    await Todo.deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(200).json({ message: `Delete Todo for ${req.params.id}`, todo });
});

const addTodoToCalendar = asyncHandler(async(req, res) => {
    const todo = await Todo.findOne({ _id: new ObjectId(req.params.id), user_id: req.user.id });
    if (!todo) {
        res.status(404);
        throw new Error("Todo Not Found!");
    }
    if (!todo.startDate || !todo.endDate || !todo.title) {
        res.status(400);
        throw new Error("Todo must have a start date, end date, and title to be added to the calendar.");
    }
    
    try {
        const calendarWebhookUrl = n8nTodosUrl;
        const payload = {
            startDate: todo.startDate,
            endDate: todo.endDate,
            title: todo.title,
            description: todo.description || '',
            location: todo.location || '',
            user: req.user.email,
            attendee: todo.attendee || '',
        };
        
        const response = await axios.post(calendarWebhookUrl, payload);
        const calendarData = response.data;

        if (calendarData && calendarData[0] && calendarData[0].htmlLink && calendarData[0].id) {
            todo.googleCalendarUrl = calendarData[0].htmlLink;
            todo.googleCalendarId = calendarData[0].id;
            await todo.save();
            res.status(200).json({ message: "Successfully added to Google Calendar", todo });
        } else {
            throw new Error("Invalid response from calendar service. Missing htmlLink or id.");
        }
    } catch(error) {
        console.error("Error adding to calendar:", error.message);
        res.status(500);
        throw new Error("Could not add to Google Calendar. " + (error.response?.data?.message || error.message));
    }
});

// FITUR BARU: Memindahkan To-Do ke dalam Task atau mengeluarkannya
const moveTodoToTask = asyncHandler(async (req, res) => {
    const { todoId, taskId } = req.params;

    const todo = await Todo.findOne({ _id: todoId, user_id: req.user.id });
    if (!todo) {
        res.status(404);
        throw new Error("Todo not found.");
    }

    const newTaskId = taskId === 'none' ? null : taskId;

    if (newTaskId) {
        const taskExists = await Task.findOne({ _id: newTaskId, user_id: req.user.id });
        if (!taskExists) {
            res.status(404);
            throw new Error("Target task not found.");
        }
    }

    todo.taskId = newTaskId;
    await todo.save();

    res.status(200).json(todo);
});


module.exports = {
  getTodo,
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
  addTodoToCalendar,
  moveTodoToTask,
};
