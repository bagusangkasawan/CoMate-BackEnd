document.addEventListener('DOMContentLoaded', () => {
    // --- Selektor Elemen ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const authAlert = document.getElementById('auth-alert');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const todoList = document.getElementById('todo-list');
    const todoForm = document.getElementById('todo-form');
    const todoModalEl = document.getElementById('todoModal');
    const todoModal = new bootstrap.Modal(todoModalEl);
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const typingIndicator = document.getElementById('typing-indicator');
    const sidebarLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');
    const profileForm = document.getElementById('profile-form');
    const profileAlert = document.getElementById('profile-alert');

    // --- State Management ---
    const API_URL = 'https://comate-backend.vercel.app/api';
    let token = localStorage.getItem('token');
    let chatSessionId = sessionStorage.getItem('chatSessionId');
    let chatMessages = JSON.parse(sessionStorage.getItem('chatMessages')) || [];
    let currentUserData = null;

    // --- Fungsi Bantuan & Render ---
    const formatDateTimeLocal = (datetime) => datetime ? `${datetime}:00.000+07:00` : "";
    const showAlert = (alertEl, message, type = 'danger') => {
        alertEl.textContent = message;
        alertEl.className = `alert alert-${type}`;
        alertEl.classList.remove('d-none');
        setTimeout(() => alertEl.classList.add('d-none'), 4000);
    };

    const saveChatState = () => { sessionStorage.setItem('chatSessionId', chatSessionId); sessionStorage.setItem('chatMessages', JSON.stringify(chatMessages)); };
    const clearChatState = () => { sessionStorage.removeItem('chatSessionId'); sessionStorage.removeItem('chatMessages'); chatMessages = []; chatSessionId = null; };
    const addChatMessage = (content, sender) => {
        const existingIndicator = chatBox.querySelector('#typing-indicator');
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.innerHTML = content;
        chatBox.insertBefore(msgDiv, existingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;
    };
    const renderChatHistory = () => {
        chatBox.querySelectorAll('.chat-message:not(#typing-indicator)').forEach(el => el.remove());
        chatMessages.forEach(msg => addChatMessage(msg.content, msg.sender));
    };
    const renderTodos = (todos) => {
        todoList.innerHTML = '';
        todos.forEach(item => {
            const statusColors = { "To Do": "secondary", "Pending": "warning", "Done": "success" };
            let calendarButton = '';
            if (item.googleCalendarUrl) {
                calendarButton = `<a href="${item.googleCalendarUrl}" target="_blank" class="btn btn-sm btn-light text-success"><i class="bi bi-check-circle-fill"></i> In Calendar</a>`;
            } else if (item.startDate && item.endDate) {
                calendarButton = `<button class="btn btn-sm btn-outline-primary add-to-calendar" data-id="${item._id}"><i class="bi bi-calendar-plus"></i> Add to Calendar</button>`;
            }
            const todoEl = document.createElement('div');
            todoEl.className = 'list-group-item d-flex justify-content-between align-items-start';
            todoEl.innerHTML = `
                <div class="ms-2 me-auto">
                    <div class="fw-bold">${item.title}</div>
                    <p class="mb-1 text-muted">${item.description || 'No description'}</p>
                    <div class="mt-2">${calendarButton}</div>
                </div>
                <div class="todo-actions">
                     <span class="badge bg-${statusColors[item.status] || 'light'} rounded-pill me-2">${item.status}</span>
                     <button class="btn btn-sm btn-danger delete-todo" data-id="${item._id}"><i class="bi bi-trash"></i></button>
                </div>`;
            todoList.appendChild(todoEl);
        });
    };

    // --- Fetch Data ---
    const fetchCurrentUser = async () => {
        try {
            const res = await fetch(`${API_URL}/users/current`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            currentUserData = data.data;
        } catch (error) {
            console.error('Failed to fetch user', error);
            logoutBtn.click();
        }
    };
    const fetchTodos = async () => {
        try {
            const res = await fetch(`${API_URL}/todo`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            renderTodos(data.todo);
        } catch (err) { console.error('Failed to fetch todos:', err); }
    };

    // --- Navigasi & Tampilan ---
    const handleNavigation = (e) => {
        e.preventDefault();
        const targetViewId = e.currentTarget.dataset.view;
        sidebarLinks.forEach(link => link.classList.remove('active'));
        e.currentTarget.classList.add('active');
        views.forEach(view => view.classList.toggle('active', view.id === targetViewId));
        if (targetViewId === 'profile-view') populateProfileForm();
    };

    const toggleViews = () => {
        if (token) {
            authContainer.classList.add('d-none');
            appContainer.classList.remove('d-none');
            
            // FIX: Atur tampilan default ke "Todos" setelah login
            sidebarLinks.forEach(link => link.classList.remove('active'));
            document.querySelector('.nav-link[data-view="todos-view"]').classList.add('active');
            
            views.forEach(view => view.classList.remove('active'));
            document.getElementById('todos-view').classList.add('active');

            fetchCurrentUser();
            fetchTodos();
            renderChatHistory();
        } else {
            authContainer.classList.remove('d-none');
            appContainer.classList.add('d-none');
        }
    };
    
    // --- Event Listeners ---
    sidebarLinks.forEach(link => link.addEventListener('click', handleNavigation));
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginView.classList.add('d-none'); registerView.classList.remove('d-none'); });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerView.classList.add('d-none'); loginView.classList.remove('d-none'); });
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        try {
            const res = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showAlert(authAlert, 'Registration successful! Please login.', 'success');
            registerForm.reset();
            showLoginLink.click();
        } catch (err) {
            showAlert(authAlert, err.message);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const login = document.getElementById('login-identifier').value;
        const password = document.getElementById('login-password').value;
        try {
            const res = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            token = data.accessToken;
            localStorage.setItem('token', token);
            toggleViews();
        } catch (err) {
            showAlert(authAlert, err.message);
        }
    });

    logoutBtn.addEventListener('click', () => {
        token = null;
        localStorage.removeItem('token');
        clearChatState();
        toggleViews();
    });

    todoList.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-todo');
        const calendarButton = e.target.closest('.add-to-calendar');
        if (deleteButton) {
            const id = deleteButton.dataset.id;
            if (confirm('Are you sure?')) {
                try {
                    const res = await fetch(`${API_URL}/todo/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) throw new Error('Failed to delete');
                    fetchTodos();
                } catch (err) { alert(err.message); }
            }
        }
        if (calendarButton) {
            const id = calendarButton.dataset.id;
            calendarButton.disabled = true;
            calendarButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Adding...';
            try {
                const res = await fetch(`${API_URL}/todo/${id}/calendar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Failed to add to calendar");
                fetchTodos();
            } catch (err) {
                alert(err.message);
                fetchTodos();
            }
        }
    });

    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const todoData = {
            title: document.getElementById('todo-title').value,
            description: document.getElementById('todo-description').value,
            status: document.getElementById('todo-status').value,
            startDate: formatDateTimeLocal(document.getElementById('todo-startDate').value),
            endDate: formatDateTimeLocal(document.getElementById('todo-endDate').value),
            location: document.getElementById('todo-location').value
        };
        try {
            const res = await fetch(`${API_URL}/todo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(todoData)
            });
            if (!res.ok) throw new Error((await res.json()).message);
            todoForm.reset();
            todoModal.hide();
            fetchTodos();
        } catch (o) { alert('Failed to create todo: ' + o.message); }
    });

    todoModalEl.addEventListener('hidden.bs.modal', () => { todoForm.reset(); document.getElementById('todo-id').value = "" });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;
        addChatMessage(message, 'user');
        chatMessages.push({ sender: 'user', content: message });
        saveChatState();
        chatInput.value = "";
        chatInput.focus();
        typingIndicator.classList.remove('d-none');
        chatBox.scrollTop = chatBox.scrollHeight;
        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ sessionId: chatSessionId, message: message })
            });
            if (!res.ok) throw new Error('Chatbot request failed');
            const data = await res.json();
            const parsedContent = marked.parse(data.output);
            addChatMessage(parsedContent, 'bot');
            chatMessages.push({ sender: 'bot', content: parsedContent });
            saveChatState();
        } catch (s) {
            const errorMsg = 'Error: Could not connect to the bot.';
            addChatMessage(errorMsg, 'bot');
            chatMessages.push({ sender: 'bot', content: errorMsg });
            saveChatState();
        } finally {
            typingIndicator.classList.add('d-none');
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    // --- Profile Logic ---
    const populateProfileForm = () => {
        if (currentUserData) {
            document.getElementById('profile-username').value = currentUserData.username;
            document.getElementById('profile-email').value = currentUserData.email;
        }
    };
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUsername = document.getElementById('profile-username').value;
        const newPassword = document.getElementById('profile-password').value;
        const payload = {};
        if (newUsername !== currentUserData.username) payload.username = newUsername;
        if (newPassword) payload.password = newPassword;
        if (Object.keys(payload).length === 0) {
            showAlert(profileAlert, 'No changes detected.', 'info');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/users/current`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showAlert(profileAlert, 'Profile updated successfully!', 'success');
            await fetchCurrentUser();
            document.getElementById('profile-password').value = '';
        } catch (err) {
            showAlert(profileAlert, err.message);
        }
    });

    // --- Inisialisasi ---
    if (!chatSessionId) { chatSessionId = `session_${Date.now()}`; saveChatState(); }
    toggleViews();
});
