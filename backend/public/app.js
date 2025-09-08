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
    const todoModalLabel = document.getElementById('todoModalLabel');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const typingIndicator = document.getElementById('typing-indicator');
    const sidebar = document.querySelector('.sidebar');
    const sidebarLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');
    const profileForm = document.getElementById('profile-form');
    const profileAlert = document.getElementById('profile-alert');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const viewTitle = document.getElementById('view-title');
    const charCounter = document.getElementById('char-counter');
    const recommendationLink = document.getElementById('recommendation-link');
    const generateRecommendationBtn = document.getElementById('generate-recommendation-btn');
    const recommendationResult = document.getElementById('recommendation-result');


    // --- State Management ---
    const API_URL = 'http://localhost:5000/api';
    let token = localStorage.getItem('token');
    let chatSessionId = sessionStorage.getItem('chatSessionId');
    let chatMessages = JSON.parse(sessionStorage.getItem('chatMessages')) || [];
    let cachedRecommendation = sessionStorage.getItem('cachedRecommendation');
    let currentUserData = null;
    let allTodos = []; 

    if (chatMessages.length === 0) {
        chatMessages.push({
            sender: 'bot',
            content: marked.parse("Halo, saya **CoMate AI** yang didukung oleh Llama. Ada yang bisa saya bantu?")
        });
    }

    // --- Fungsi Bantuan & Render ---
    const toLocalISOString = (date) => {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, 16);
        return localISOTime;
    }

    const fromDateTimeLocal = (datetimeLocalString) => {
        if (!datetimeLocalString) return "";
        return `${datetimeLocalString}:00.000+07:00`;
    };
    
    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    };

    const showAlert = (alertEl, message, type = 'danger') => {
        alertEl.textContent = message;
        alertEl.className = `alert alert-${type}`;
        alertEl.classList.remove('d-none');
        setTimeout(() => alertEl.classList.add('d-none'), 4000);
    };
    const saveChatState = () => { sessionStorage.setItem('chatSessionId', chatSessionId); sessionStorage.setItem('chatMessages', JSON.stringify(chatMessages)); };
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
        allTodos = todos;
        todoList.innerHTML = '';

        if (allTodos.length >= 3) {
            recommendationLink.classList.remove('disabled');
            recommendationLink.removeAttribute('title');
        } else {
            recommendationLink.classList.add('disabled');
            recommendationLink.setAttribute('title', 'Add at least 3 todos to unlock.');
        }

        if (todos.length === 0) {
            todoList.innerHTML = `<div class="text-center p-5 text-muted">No todos yet. Add one to get started!</div>`;
            return;
        }
        todos.forEach(item => {
            const statusColors = { "To Do": "secondary", "Pending": "warning", "Done": "success" };
            
            let calendarButton = '';
            if (item.googleCalendarUrl) {
                calendarButton = `<a href="${item.googleCalendarUrl}" target="_blank" class="btn btn-sm btn-outline-success action-btn"><i class="bi bi-calendar-check"></i> In Calendar</a>`;
            } else if (item.startDate && item.endDate) {
                calendarButton = `<button class="btn btn-sm btn-outline-primary add-to-calendar action-btn" data-id="${item._id}"><i class="bi bi-calendar-plus"></i> Add to Calendar</button>`;
            }

            let detailsHTML = `<div class="todo-details mt-2">`;
            if (item.description) {
                detailsHTML += `<p class="fst-italic text-muted">"${item.description}"</p>`;
            }
            if (item.startDate && item.endDate) {
                detailsHTML += `<div class="detail-item">
                                    <i class="bi bi-calendar-event"></i> 
                                    <span>${formatDisplayDate(item.startDate)} &mdash; ${formatDisplayDate(item.endDate)}</span>
                                </div>`;
            }
            if (item.location) {
                detailsHTML += `<div class="detail-item">
                                    <i class="bi bi-geo-alt-fill"></i>
                                    <span>${item.location}</span>
                                </div>`;
            }
            if (item.attendee) {
                detailsHTML += `<div class="detail-item">
                                    <i class="bi bi-person-fill"></i>
                                    <span>Invited: ${item.attendee}</span>
                                </div>`;
            }
            detailsHTML += `</div>`;
            
            const todoEl = document.createElement('div');
            todoEl.className = 'list-group-item todo-item';
            todoEl.innerHTML = `
                <div class="todo-item-main">
                    <span class="badge bg-${statusColors[item.status] || 'light'}">${item.status}</span>
                    <strong class="todo-title">${item.title}</strong>
                    ${detailsHTML}
                </div>
                <div class="todo-item-actions">
                    ${calendarButton}
                    <button class="btn btn-sm btn-outline-secondary edit-todo action-btn" data-id="${item._id}"><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-todo action-btn" data-id="${item._id}"><i class="bi bi-trash"></i> Delete</button>
                </div>`;
            todoList.appendChild(todoEl);
        });
    };

    const renderRecommendationView = () => {
        if (cachedRecommendation) {
            recommendationResult.innerHTML = cachedRecommendation;
        } else {
            recommendationResult.innerHTML = `<div class="text-center p-5 text-muted">Recommendation from CoMate AI will be displayed here. Click the button above to generate one.</div>`;
        }
    };

    // --- Fetch Data ---
    const fetchCurrentUser = async () => {
        try {
            const res = await fetch(`${API_URL}/users/current`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            currentUserData = data.data;
        } catch (error) { console.error('Failed to fetch user', error); logoutBtn.click(); }
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
        if (e.currentTarget.classList.contains('disabled')) return;
        
        const targetViewId = e.currentTarget.dataset.view;
        const targetTitle = e.currentTarget.querySelector('span').textContent;

        sidebarLinks.forEach(link => link.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        views.forEach(view => view.classList.remove('active'));
        document.getElementById(targetViewId).classList.add('active');

        viewTitle.textContent = targetTitle;

        if (targetViewId === 'profile-view') populateProfileForm();
        if (targetViewId === 'recommendation-view') renderRecommendationView();

        if (window.innerWidth <= 992) {
            sidebar.classList.remove('is-open');
            mobileOverlay.classList.remove('active');
        }
    };

    const toggleViews = () => {
        if (token) {
            authContainer.classList.add('d-none');
            appContainer.classList.remove('d-none');
            const initialLink = document.querySelector('.nav-link[data-view="todos-view"]');
            handleNavigation({ preventDefault: () => {}, currentTarget: initialLink });
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
    
    mobileNavToggle.addEventListener('click', () => {
        sidebar.classList.toggle('is-open');
        mobileOverlay.classList.toggle('active');
    });

    mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('is-open');
        mobileOverlay.classList.remove('active');
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: registerForm.elements['register-username'].value, email: registerForm.elements['register-email'].value, password: registerForm.elements['register-password'].value }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showAlert(authAlert, 'Registration successful! Please login.', 'success');
            registerForm.reset();
            showLoginLink.click();
        } catch (err) { showAlert(authAlert, err.message); }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: loginForm.elements['login-identifier'].value, password: loginForm.elements['login-password'].value }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            token = data.accessToken;
            localStorage.setItem('token', token);
            toggleViews();
        } catch (err) { showAlert(authAlert, err.message); }
    });

    logoutBtn.addEventListener('click', () => { 
        token = null; 
        localStorage.removeItem('token'); 
        sessionStorage.removeItem('chatSessionId');
        sessionStorage.removeItem('chatMessages');
        sessionStorage.removeItem('cachedRecommendation');
        chatMessages = []; 
        cachedRecommendation = null;
        chatMessages.push({
            sender: 'bot',
            content: marked.parse("Halo, saya **CoMate AI** yang didukung oleh Llama. Ada yang bisa saya bantu?")
        });
        toggleViews(); 
    });

    todoList.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-todo');
        const calendarButton = e.target.closest('.add-to-calendar');
        const editButton = e.target.closest('.edit-todo');

        if (deleteButton) {
            const id = deleteButton.dataset.id;
            if (confirm('Are you sure you want to delete this todo?')) {
                // UPDATE: Menambahkan loading state saat delete
                const todoItemActions = deleteButton.closest('.todo-item-actions');
                const originalButtons = todoItemActions.innerHTML;
                todoItemActions.querySelectorAll('.action-btn').forEach(btn => btn.disabled = true);
                deleteButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Deleting...`;
                
                try {
                    const res = await fetch(`${API_URL}/todo/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) throw new Error('Failed to delete');
                    // fetchTodos akan merender ulang list, jadi tidak perlu restore button secara manual
                    fetchTodos();
                } catch (err) {
                    alert(err.message);
                    // Jika gagal, kembalikan tombol ke keadaan semula
                    todoItemActions.innerHTML = originalButtons;
                }
            }
        }
        if (calendarButton) {
            if (confirm("Are you sure you want to add this to Google Calendar? The start and end dates cannot be changed after this.")) {
                const id = calendarButton.dataset.id;
                calendarButton.disabled = true;
                calendarButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Adding...';
                try {
                    const res = await fetch(`${API_URL}/todo/${id}/calendar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) throw new Error((await res.json()).message || "Failed to add to calendar");
                    fetchTodos();
                } catch (err) { alert(err.message); fetchTodos(); }
            }
        }
        if (editButton) {
            const id = editButton.dataset.id;
            const todoToEdit = allTodos.find(t => t._id === id);
            if(todoToEdit) {
                todoForm.elements['todo-id'].value = todoToEdit._id;
                todoForm.elements['todo-title'].value = todoToEdit.title;
                todoForm.elements['todo-description'].value = todoToEdit.description || '';
                todoForm.elements['todo-status'].value = todoToEdit.status;
                todoForm.elements['todo-startDate'].value = todoToEdit.startDate ? toLocalISOString(new Date(todoToEdit.startDate)) : '';
                todoForm.elements['todo-endDate'].value = todoToEdit.endDate ? toLocalISOString(new Date(todoToEdit.endDate)) : '';
                todoForm.elements['todo-location'].value = todoToEdit.location || '';
                todoForm.elements['todo-attendee'].value = todoToEdit.attendee || '';
                
                const dateInputsDisabled = !!todoToEdit.googleCalendarId;
                todoForm.elements['todo-startDate'].disabled = dateInputsDisabled;
                todoForm.elements['todo-endDate'].disabled = dateInputsDisabled;

                todoModalLabel.textContent = 'Edit Todo';
                todoModal.show();
            }
        }
    });

    addTodoBtn.addEventListener('click', () => {
        todoForm.reset();
        todoForm.elements['todo-id'].value = '';
        todoForm.elements['todo-startDate'].disabled = false;
        todoForm.elements['todo-endDate'].disabled = false;
        todoModalLabel.textContent = 'Add New Todo';
        todoModal.show();
    });

    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveButton = todoForm.querySelector('button[type="submit"]');
        const originalButtonHTML = saveButton.innerHTML;
        saveButton.disabled = true;
        saveButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...`;

        try {
            const id = todoForm.elements['todo-id'].value;
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/todo/${id}` : `${API_URL}/todo`;
            
            const todoData = {};
            const attendeeValue = todoForm.elements['todo-attendee'].value.trim();
            if (attendeeValue) { todoData.attendee = attendeeValue; }
            todoData.title = todoForm.elements['todo-title'].value;
            todoData.description = todoForm.elements['todo-description'].value;
            todoData.status = todoForm.elements['todo-status'].value;
            todoData.location = todoForm.elements['todo-location'].value;
            if (id && todoForm.elements['todo-startDate'].disabled) {
                const originalTodo = allTodos.find(t => t._id === id);
                if (originalTodo) { todoData.startDate = originalTodo.startDate; todoData.endDate = originalTodo.endDate; }
            } else {
                todoData.startDate = fromDateTimeLocal(todoForm.elements['todo-startDate'].value);
                todoData.endDate = fromDateTimeLocal(todoForm.elements['todo-endDate'].value);
            }

            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(todoData) });
            if (!res.ok) throw new Error((await res.json()).message);
            todoModal.hide();
            fetchTodos();
        } catch (err) {
            alert(`Failed to save todo: ${err.message}`);
        } finally {
            saveButton.disabled = false;
            saveButton.innerHTML = originalButtonHTML;
        }
    });

    todoModalEl.addEventListener('hidden.bs.modal', () => { 
        todoForm.reset(); 
        todoForm.elements['todo-startDate'].disabled = false;
        todoForm.elements['todo-endDate'].disabled = false;
    });

    chatInput.addEventListener('input', () => {
        const count = chatInput.value.length;
        charCounter.textContent = `${count}/250`;
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;
        addChatMessage(message, 'user');
        chatMessages.push({ sender: 'user', content: message });
        saveChatState();
        chatInput.value = ""; 
        charCounter.textContent = '0/250';
        chatInput.focus();
        typingIndicator.classList.remove('d-none');
        chatBox.scrollTop = chatBox.scrollHeight;
        try {
            const res = await fetch(`${API_URL}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ sessionId: chatSessionId, message: message }) });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Chatbot request failed');
            }
            const data = await res.json();
            const parsedContent = marked.parse(data.output);
            addChatMessage(parsedContent, 'bot');
            chatMessages.push({ sender: 'bot', content: parsedContent });
            saveChatState();
        } catch (err) {
            const errorMsg = `Error: ${err.message}`;
            addChatMessage(errorMsg, 'bot');
            chatMessages.push({ sender: 'bot', content: errorMsg });
            saveChatState();
        } finally {
            typingIndicator.classList.add('d-none');
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    generateRecommendationBtn.addEventListener('click', async () => {
        const originalButtonHTML = generateRecommendationBtn.innerHTML;
        generateRecommendationBtn.disabled = true;
        generateRecommendationBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Generating...`;
        
        recommendationResult.innerHTML = `
            <div class="loading-spinner-container">
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>`;

        const todosString = allTodos.map(t => `- ${t.title} (Status: ${t.status})`).join('\n');
        const prompt = `Based on my current todo list below, please provide a priority recommendation. Analyze the tasks and suggest which ones I should focus on first. Explain your reasoning briefly. Format your response in markdown.\n\nMy Todos:\n${todosString}`;

        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ sessionId: `recommendation_${Date.now()}`, message: prompt })
            });
             if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to get recommendation');
            }
            const data = await res.json();
            const parsedHtml = marked.parse(data.output);
            recommendationResult.innerHTML = parsedHtml;
            cachedRecommendation = parsedHtml;
            sessionStorage.setItem('cachedRecommendation', parsedHtml);
        } catch (err) {
            recommendationResult.innerHTML = `<div class="alert alert-danger">Failed to generate recommendation: ${err.message}</div>`;
        } finally {
            generateRecommendationBtn.disabled = false;
            generateRecommendationBtn.innerHTML = originalButtonHTML;
        }
    });

    const populateProfileForm = () => {
        if (currentUserData) {
            profileForm.elements['profile-username'].value = currentUserData.username;
            profileForm.elements['profile-email'].value = currentUserData.email;
        }
    };

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUsername = profileForm.elements['profile-username'].value;
        const newEmail = profileForm.elements['profile-email'].value;
        const newPassword = profileForm.elements['profile-password'].value;
        const payload = {};
        if (newUsername !== currentUserData.username) payload.username = newUsername;
        if (newEmail !== currentUserData.email) payload.email = newEmail;
        if (newPassword) payload.password = newPassword;
        if (Object.keys(payload).length === 0) { showAlert(profileAlert, 'No changes detected.', 'info'); return; }
        try {
            const res = await fetch(`${API_URL}/users/current`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(payload) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showAlert(profileAlert, 'Profile updated successfully!', 'success');
            await fetchCurrentUser();
            populateProfileForm(); 
            profileForm.elements['profile-password'].value = '';
        } catch (err) { showAlert(profileAlert, err.message); }
    });

    if (!chatSessionId) { chatSessionId = `session_${Date.now()}`; saveChatState(); }
    toggleViews();
});
