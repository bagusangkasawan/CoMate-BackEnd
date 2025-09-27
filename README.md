# 🖥️ Backend CoMate App

Backend CoMate App berperan sebagai pusat logika bisnis dan jembatan antara frontend, database, serta layanan AI eksternal.

---

## ⚙️ Teknologi Backend

* **Node.js** – runtime server-side JavaScript
* **Express.js** – framework backend untuk routing dan middleware
* **MongoDB** – database NoSQL
* **Mongoose** – ODM untuk mempermudah pengelolaan schema dan query
* **JWT (JSON Web Token)** – autentikasi dan otorisasi pengguna
* **n8n (Middleware)** – orkestrasi workflow AI
* **Groq API (Llama 3)** – inference AI berkecepatan tinggi

---

## 🏗️ Arsitektur Backend

1. **API Layer (Express.js):**

   * Menyediakan endpoint CRUD untuk Task & To-Do.
   * Endpoint autentikasi (register, login, verifikasi token).
   * Endpoint integrasi Google Calendar.
   * Endpoint khusus untuk request AI (chatbot & rekomendasi).

2. **Database Layer (MongoDB + Mongoose):**

   * Menyimpan data pengguna, task, to-do, dan status premium.
   * Validasi dan relasi sederhana antar model.

3. **AI Middleware Integration (n8n):**

   * Backend mengirimkan request ke **n8n webhook**.
   * n8n meneruskan data ke **Groq API (Llama 3)** untuk proses inferensi.
   * Hasil dikembalikan ke backend lalu diteruskan ke frontend.

4. **Authentication & Authorization (JWT):**

   * Backend menghasilkan JWT setelah login.
   * Semua endpoint privat divalidasi dengan token.

---

## 🔄 Alur Data Backend

```
Frontend -> Backend (Express API) -> n8n Webhook -> Groq API (Llama 3)
           ^                                               |
           |-----------------------------------------------|
```

* **Frontend → Backend:** request user (CRUD, login, AI).
* **Backend → n8n:** request AI diforward ke middleware.
* **n8n → Groq API:** Llama 3 melakukan inferensi.
* **Groq API → n8n → Backend:** hasil diproses dan dikembalikan ke frontend.

---
