# CoMate AI - Your Intelligent To-Do List Companion

> ⚠️ **Catatan:** Ini adalah **prototype**. Versi frontend lengkap sedang dalam proses re-write.

CoMate AI adalah aplikasi To-Do list cerdas yang dirancang untuk membantu Anda mengelola tugas harian dengan lebih efisien.  
Aplikasi ini tidak hanya menyediakan fungsionalitas CRUD (Create, Read, Update, Delete) standar, tetapi juga dilengkapi dengan fitur premium berbasis AI untuk memberikan rekomendasi prioritas tugas.

> 🏆 **CoMate AI ini dibuat khusus untuk mengikuti Kompetisi Hackathon “Accelerate with Llama” yang diadakan oleh Hacktiv8 x Meta.**

---

## ✨ Fitur Utama

- **Manajemen Tugas (Task):** Kelompokkan To-Do Anda ke dalam beberapa tugas agar lebih terorganisir.  
- **Manajemen To-Do:** Buat, edit, hapus, dan atur status To-Do (To Do, Pending, Done).  
- **Integrasi Google Calendar:** Jadwalkan To-Do Anda langsung ke Google Calendar dengan satu klik.  
- **AI Chatbot:** Asisten chatbot untuk membantu menjawab pertanyaan atau sekadar berdiskusi.  
- **Sistem Premium:**
  - **AI Smart Recommendation:** Dapatkan rekomendasi cerdas tentang tugas mana yang harus diprioritaskan.  
  - **Kuota To-Do Tanpa Batas:** Pengguna gratis dibatasi hingga 10 To-Do, sedangkan pengguna premium tidak memiliki batasan.  
  - **Berlangganan dengan Voucher:** Sistem langganan premium diaktifkan menggunakan kode voucher.  

---

## 🚀 Live Demo

Aplikasi ini sudah di-hosting dan siap untuk Anda gunakan.  
Kunjungi tautan di bawah ini untuk mengakses antarmuka pengguna (frontend):

👉 [CoMate AI Live di GitHub Pages](https://bagusangkasawan.github.io/CoMate-BackEnd)

**Catatan:**
- Frontend di-hosting secara publik di GitHub Pages.  
- Backend (termasuk API dan koneksi database) di-hosting secara privat di Vercel.  
- Anda tidak perlu melakukan instalasi backend untuk menggunakan versi live ini.  

---

## 🏗️ Arsitektur & Teknologi

Aplikasi ini dibangun dengan arsitektur full-stack JavaScript modern, dengan integrasi unik untuk fitur AI.

**Frontend:**
- HTML5  
- CSS3  
- JavaScript (Vanilla JS)  
- Bootstrap 5  

**Backend:**
- Node.js  
- Express.js  
- MongoDB (Database)  
- Mongoose (ODM)  
- JSON Web Token (JWT) untuk autentikasi  

---

## 🤖 Arsitektur Integrasi AI

Fitur AI di CoMate (Chatbot dan Smart Recommendation) ditenagai oleh **Llama 3** yang diakses melalui **Groq API** untuk mendapatkan kecepatan inferensi tinggi.  
Peran orkestrasi dan middleware ditangani oleh **n8n**, yang memisahkan logika AI dari aplikasi utama.

**Alur kerja:**
1. **Client (Frontend):** Pengguna meminta rekomendasi AI atau mengirim pesan ke chatbot.  
2. **Server (Node.js):** Backend menerima permintaan lalu meneruskannya ke Webhook URL n8n.  
3. **Middleware (n8n):**
   - Workflow menerima data dari webhook.  
   - Data diformat dan dikirim ke Groq API (model Llama 3).  
   - n8n menunggu respons dari Groq.  
4. **Groq API:** Memproses permintaan dengan Llama 3 dan mengembalikan hasil ke n8n.  
5. **Respons:** n8n mengembalikan hasil ke server Node.js → diteruskan ke frontend → ditampilkan ke pengguna.  

**Diagram alur sederhana:**  
```
Frontend -> Backend (Node.js) -> n8n Webhook -> Groq API (Llama 3) -> n8n -> Backend -> Frontend
```

Pendekatan ini membuat backend utama tetap ringan dan fokus pada logika bisnis, sementara tugas berat pemanggilan AI dan manajemen kunci API ditangani oleh n8n.
