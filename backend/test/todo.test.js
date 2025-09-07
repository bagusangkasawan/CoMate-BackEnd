// test/todo.test.js

const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const {
  connect,
  closeDatabase,
  clearDatabase,
} = require("./mongoMemoryServer");

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe("CRUD operations for Todo", () => {
  it("should create a new todo", async () => {
    const res = await request(app).post("/todos").send({
      title: "Test Todo",
      description: "Test Description",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("title", "Test Todo");
  });

  it("should fetch all todos", async () => {
    const res = await request(app).get("/todos");
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should fetch a single todo by id", async () => {
    const todo = new mongoose.models.Todo({
      title: "Single Todo",
      description: "Single Description",
    });
    await todo.save();

    const res = await request(app).get(`/todos/${todo._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title", "Single Todo");
  });

  it("should update a todo by id", async () => {
    const todo = new mongoose.models.Todo({
      title: "Update Todo",
      description: "Update Description",
    });
    await todo.save();

    const res = await request(app).put(`/todos/${todo._id}`).send({
      title: "Updated Todo",
      description: "Updated Description",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title", "Updated Todo");
  });

  it("should delete a todo by id", async () => {
    const todo = new mongoose.models.Todo({
      title: "Delete Todo",
      description: "Delete Description",
    });
    await todo.save();

    const res = await request(app).delete(`/todos/${todo._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Todo successfully deleted");
  });
});
