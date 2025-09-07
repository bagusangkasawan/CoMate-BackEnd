// test/user.test.js

const request = require("supertest");
const app = require("../server.js");
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

describe("User Authentication", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "testpassword",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("message", "User registered successfully");
  });

  it("should not register a user with an existing email", async () => {
    // First registration
    await request(app).post("/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "testpassword",
    });

    // Attempt to register again with the same email
    const res = await request(app).post("/register").send({
      username: "anotheruser",
      email: "testuser@example.com",
      password: "anotherpassword",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "User already exists");
  });

  it("should login an existing user", async () => {
    // Register a user first
    await request(app).post("/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "testpassword",
    });

    // Attempt to login with the same credentials
    const res = await request(app).post("/login").send({
      email: "testuser@example.com",
      password: "testpassword",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Login successful");
    expect(res.body).toHaveProperty("token"); // Assuming a token is returned on successful login
  });

  it("should not login with invalid credentials", async () => {
    // Register a user first
    await request(app).post("/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "testpassword",
    });

    // Attempt to login with incorrect password
    const res = await request(app).post("/login").send({
      email: "testuser@example.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Invalid credentials");
  });
});
