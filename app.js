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
    const todoAndTaskList = document.getElementById('todo-and-task-list');

    // Forms & Modals
    const todoForm = document.getElementById('todo-form');
    const todoModalEl = document.getElementById('todoModal');
    const todoModal = new bootstrap.Modal(todoModalEl);
    const todoModalLabel = document.getElementById('todoModalLabel');
    
    const taskForm = document.getElementById('task-form');
    const taskModalEl = document.getElementById('taskModal');
    const taskModal = new bootstrap.Modal(taskModalEl);
    const taskModalLabel = document.getElementById('taskModalLabel');

    const premiumModalEl = document.getElementById('premiumModal');
    const premiumModal = new bootstrap.Modal(premiumModalEl);
    const premiumModalMessage = document.getElementById('premium-modal-message');
    const goToProfileBtn = document.getElementById('go-to-profile-btn');

    // Buttons
    const addTodoBtn = document.getElementById('add-todo-btn');
    const addTaskBtn = document.getElementById('add-task-btn');
    
    // Chatbot
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const typingIndicator = document.getElementById('typing-indicator');
    const charCounter = document.getElementById('char-counter');
    
    // Nav & Profile
    const sidebar = document.querySelector('.sidebar');
    const sidebarLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');
    const profileForm = document.getElementById('profile-form');
    const profileAlert = document.getElementById('profile-alert');
    const subscriptionStatusDiv = document.getElementById('subscription-status');
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const viewTitle = document.getElementById('view-title');
    
    // Recommendation
    const recommendationLink = document.getElementById('recommendation-link');
    const generateRecommendationBtn = document.getElementById('generate-recommendation-btn');
    const recommendationResult = document.getElementById('recommendation-result');


    // --- State Management ---
    const API_URL = 'https://comate-backend.vercel.app/api';
    let token = localStorage.getItem('token');
    let chatSessionId = sessionStorage.getItem('chatSessionId');
    let chatMessages = JSON.parse(sessionStorage.getItem('chatMessages')) || [];
    let cachedRecommendation = sessionStorage.getItem('cachedRecommendation');
    let currentUserData = null;
    let allTodos = [];
    let allTasks = [];

    if (chatMessages.length === 0) {
        chatMessages.push({
            sender: 'bot',
            content: marked.parse("Halo, saya **CoMate AI** yang didukung oleh Llama. Ada yang bisa saya bantu?")
        });
    }

    // --- Fungsi Bantuan & Render ---
    const toLocalISOString = (date) => new Date(date - (new Date()).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const fromDateTimeLocal = (datetime) => datetime ? `${datetime}:00.000+07:00` : "";
    const formatDisplayDate = (dateString) => dateString ? new Date(dateString).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const showAlert = (el, msg, type = 'danger') => { el.textContent = msg; el.className = `alert alert-${type}`; el.classList.remove('d-none'); setTimeout(() => el.classList.add('d-none'), 4000); };
    const saveChatState = () => { sessionStorage.setItem('chatSessionId', chatSessionId); sessionStorage.setItem('chatMessages', JSON.stringify(chatMessages)); };

    const renderSubscriptionStatus = () => {
        if (!currentUserData) return;
        if (currentUserData.isPremium) {
            subscriptionStatusDiv.innerHTML = `
                <div class="alert alert-success d-flex align-items-center">
                    <i class="bi bi-patch-check-fill me-2"></i>
                    <div>
                        <h4 class="alert-heading">Premium Member</h4>
                        <p class="mb-0">You have access to all features and unlimited todos!</p>
                    </div>
                </div>`;
            document.body.classList.remove('non-premium');
            document.body.classList.add('premium');
        } else {
            subscriptionStatusDiv.innerHTML = `
                <div class="alert alert-light">
                    <h4 class="alert-heading">Free Account</h4>
                    <p>You are on the free plan with a limit of 10 todos.</p>
                    <hr>
                    <p class="mb-0 fw-bold">Upgrade to Premium</p>
                    <form id="subscribe-form">
                        <div class="input-group mt-2">
                            <input type="text" id="voucher-input" class="form-control" placeholder="Enter Voucher Code" required>
                            <button class="btn btn-warning" type="submit">Subscribe</button>
                        </div>
                         <div id="subscribe-alert" class="d-none mt-2"></div>
                    </form>
                </div>`;
            document.body.classList.add('non-premium');
            document.body.classList.remove('premium');
        }
    };
    
    const renderTasksAndTodos = () => {
        todoAndTaskList.innerHTML = '';
        
        // Render tasks and their todos
        allTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-group';
            taskEl.dataset.taskId = task._id;
            const todosInTask = allTodos.filter(todo => todo.taskId === task._id);

            taskEl.innerHTML = `
                <div class="task-header">
                    <h5 class="task-title">${task.title}</h5>
                    <div class="task-controls">
                        <button class="btn btn-sm btn-outline-secondary edit-task-btn" title="Edit Task"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger delete-task-btn" title="Delete Task"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
                <div class="task-body list-group list-group-flush">
                    ${todosInTask.length > 0 ? todosInTask.map(todo => createTodoHTML(todo)).join('') : '<div class="p-3 text-muted text-center">No todos in this task yet.</div>'}
                </div>
            `;
            todoAndTaskList.appendChild(taskEl);
        });

        // Render uncategorized todos
        const uncategorizedTodos = allTodos.filter(todo => !todo.taskId);
        if (uncategorizedTodos.length > 0) {
            const uncategorizedTitle = document.createElement('h5');
            uncategorizedTitle.className = 'uncategorized-todos-title mt-4';
            uncategorizedTitle.textContent = 'Other Todos';
            todoAndTaskList.appendChild(uncategorizedTitle);

            const uncategorizedList = document.createElement('div');
            uncategorizedList.className = 'list-group';
            uncategorizedList.innerHTML = uncategorizedTodos.map(todo => createTodoHTML(todo)).join('');
            todoAndTaskList.appendChild(uncategorizedList);
        }

        if (allTodos.length === 0 && allTasks.length === 0) {
             todoAndTaskList.innerHTML = `<div class="text-center p-5 text-muted">No tasks or todos yet. Add one to get started!</div>`;
        }
    };
    
    const createTodoHTML = (item) => {
        const statusColors = { "To Do": "secondary", "Pending": "warning", "Done": "success" };
        let calendarButton = '';
        if (item.googleCalendarUrl) {
            calendarButton = `<a href="${item.googleCalendarUrl}" target="_blank" class="btn btn-sm btn-outline-success action-btn" title="View in Calendar"><i class="bi bi-calendar-check"></i></a>`;
        } else if (item.startDate && item.endDate) {
            calendarButton = `<button class="btn btn-sm btn-outline-primary add-to-calendar action-btn" data-id="${item._id}" title="Add to Calendar"><i class="bi bi-calendar-plus"></i></button>`;
        }

        const moveOptions = allTasks
            .filter(task => task._id !== item.taskId)
            .map(task => `<a class="dropdown-item move-todo" href="#" data-task-id="${task._id}">Move to ${task.title}</a>`)
            .join('');
        const uncategorizeOption = item.taskId ? '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item move-todo" href="#" data-task-id="none">Remove from Task</a></li>' : '';

        return `
            <div class="list-group-item todo-item" data-todo-id="${item._id}">
                <div class="todo-item-main">
                    <span class="badge bg-${statusColors[item.status] || 'light'}">${item.status}</span>
                    <strong class="todo-title">${item.title}</strong>
                    <div class="todo-details mt-2">
                        ${item.description ? `<p class="fst-italic text-muted">"${item.description}"</p>` : ''}
                        ${item.startDate && item.endDate ? `<div class="detail-item"><i class="bi bi-calendar-event"></i> <span>${formatDisplayDate(item.startDate)} &mdash; ${formatDisplayDate(item.endDate)}</span></div>` : ''}
                        ${item.location ? `<div class="detail-item"><i class="bi bi-geo-alt-fill"></i> <span>${item.location}</span></div>` : ''}
                        ${item.attendee ? `<div class="detail-item"><i class="bi bi-person-fill"></i> <span>Invited: ${item.attendee}</span></div>` : ''}
                    </div>
                </div>
                <div class="todo-item-actions">
                    ${calendarButton}
                    <div class="dropdown">
                      <button class="btn btn-sm btn-outline-secondary action-btn" type="button" data-bs-toggle="dropdown" data-bs-strategy="fixed" title="Move Todo"><i class="bi bi-folder-symlink"></i></button>
                      <ul class="dropdown-menu">
                        ${moveOptions || '<li><a class="dropdown-item disabled" href="#">No other tasks</a></li>'}
                        ${uncategorizeOption}
                      </ul>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary edit-todo action-btn" data-id="${item._id}" title="Edit Todo"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-todo action-btn" data-id="${item._id}" title="Delete Todo"><i class="bi bi-trash"></i></button>
                </div>
            </div>`;
    };
    
    // --- API Calls ---
    const apiCall = async (endpoint, method = 'GET', body = null) => {
        const options = {
            method,
            headers: { 'Authorization': `Bearer ${token}` }
        };
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        const res = await fetch(`${API_URL}${endpoint}`, options);
        const data = await res.json();
        if (!res.ok) {
            if (res.status === 401) logoutBtn.click();
            throw new Error(data.message || 'API request failed');
        }
        return data;
    };

    const fetchAllData = async () => {
        try {
            await fetchCurrentUser();
            const [todosData, tasksData] = await Promise.all([
                apiCall('/todo'),
                apiCall('/tasks')
            ]);
            allTodos = todosData.todo;
            allTasks = tasksData;
            renderTasksAndTodos();
            renderSubscriptionStatus();
        } catch (err) { console.error('Failed to fetch data:', err); }
    };

    const fetchCurrentUser = async () => {
        try {
            const data = await apiCall('/users/current');
            currentUserData = data.data;
        } catch (error) { console.error('Failed to fetch user', error); }
    };
    
    // --- Navigasi & Tampilan ---
    const handleNavigation = (e) => {
        e.preventDefault();
        const targetViewId = e.currentTarget.dataset.view;
        
        if(targetViewId === 'recommendation-view' && !currentUserData.isPremium) {
            premiumModalMessage.textContent = 'AI Smart Recommendation is a premium feature.';
            premiumModal.show();
            return;
        }

        const targetTitle = e.currentTarget.querySelector('span').textContent;
        sidebarLinks.forEach(link => link.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        views.forEach(view => {
            view.style.display = view.id === targetViewId ? 'flex' : 'none';
        });

        viewTitle.textContent = targetTitle;

        if (targetViewId === 'profile-view') {
            populateProfileForm();
            renderSubscriptionStatus();
        }
        if (targetViewId === 'chatbot-view') {
            renderChatHistory();
        }
        if (targetViewId === 'recommendation-view') {
            const cachedRecommendation = sessionStorage.getItem('cachedRecommendation');
            if (cachedRecommendation) {
                recommendationResult.innerHTML = cachedRecommendation;
            }
        }
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('is-open');
            mobileOverlay.classList.remove('active');
        }
    };
    
    const toggleViews = async () => {
        if (token) {
            authContainer.classList.add('d-none');
            appContainer.classList.remove('d-none');
            await fetchAllData();
            const initialLink = document.querySelector('.nav-link[data-view="todos-view"]');
            handleNavigation({ preventDefault: () => {}, currentTarget: initialLink });
        } else {
            authContainer.classList.remove('d-none');
            appContainer.classList.add('d-none');
        }
    };
    
    // --- Event Listeners ---
    sidebarLinks.forEach(link => link.addEventListener('click', handleNavigation));
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginView.classList.add('d-none'); registerView.classList.remove('d-none'); });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerView.classList.add('d-none'); loginView.classList.remove('d-none'); });
    mobileNavToggle.addEventListener('click', () => { sidebar.classList.toggle('is-open'); mobileOverlay.classList.toggle('active'); });
    mobileOverlay.addEventListener('click', () => { sidebar.classList.remove('is-open'); mobileOverlay.classList.remove('active'); });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.submitter;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Registering...`;
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
        finally { btn.disabled = false; btn.innerHTML = `Register`; }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.submitter;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Logging In...`;
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
        finally { btn.disabled = false; btn.innerHTML = `Login`; }
    });

    logoutBtn.addEventListener('click', () => {
        setTimeout(() => {
            token = null; 
            localStorage.clear();
            sessionStorage.clear();
            chatMessages = [{ sender: 'bot', content: marked.parse("Halo, saya **CoMate AI** yang didukung oleh Llama. Ada yang bisa saya bantu?") }];
            toggleViews();
        }, 300);
    });

    // --- Task & Todo Event Listeners ---
    todoAndTaskList.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-todo');
        const editBtn = e.target.closest('.edit-todo');
        const moveLink = e.target.closest('.move-todo');
        const deleteTaskBtn = e.target.closest('.delete-task-btn');
        const editTaskBtn = e.target.closest('.edit-task-btn');
        const calendarButton = e.target.closest('.add-to-calendar');

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm('Are you sure you want to delete this todo?')) {
                try {
                    await apiCall(`/todo/${id}`, 'DELETE');
                    allTodos = allTodos.filter(t => t._id !== id);
                    renderTasksAndTodos();
                } catch (err) { alert(err.message); }
            }
        }
        if (editBtn) {
            todoModal.show(editBtn);
        }
        if (moveLink) {
            e.preventDefault();
            const todoId = moveLink.closest('.todo-item').dataset.todoId;
            const newTaskId = moveLink.dataset.taskId;

            try {
                await apiCall(`/todo/${todoId}/move/${newTaskId}`, 'PUT');
                const index = allTodos.findIndex(t => t && t._id === todoId);
                if (index !== -1) {
                    allTodos[index].taskId = newTaskId === 'none' ? null : newTaskId;
                }
                renderTasksAndTodos();
            } catch (err) {
                alert(err.message);
                fetchAllData();
            }
        }
        if (deleteTaskBtn) {
            const taskId = deleteTaskBtn.closest('.task-group').dataset.taskId;
            if (confirm('Are you sure you want to delete this task? Todos inside will not be deleted.')) {
                try {
                    await apiCall(`/tasks/${taskId}`, 'DELETE');
                    allTasks = allTasks.filter(t => t._id !== taskId);
                    allTodos.forEach(todo => { if (todo.taskId === taskId) todo.taskId = null; });
                    renderTasksAndTodos();
                } catch (err) { alert(err.message); }
            }
        }
        if (editTaskBtn) {
            const taskId = editTaskBtn.closest('.task-group').dataset.taskId;
            const task = allTasks.find(t => t._id === taskId);
            if (task) {
                taskForm.elements['task-id'].value = task._id;
                taskForm.elements['task-title'].value = task.title;
                taskModalLabel.textContent = 'Edit Task';
                taskModal.show();
            }
        }
        if (calendarButton) {
            if (confirm("Are you sure you want to add this to Google Calendar? The start and end dates cannot be changed after this.")) {
                const id = calendarButton.dataset.id;
                calendarButton.disabled = true;
                calendarButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
                try {
                    await apiCall(`/todo/${id}/calendar`, 'POST');
                    const todosData = await apiCall('/todo');
                    allTodos = todosData.todo;
                    renderTasksAndTodos();
                } catch (err) { 
                    alert(err.message);
                    renderTasksAndTodos();
                }
            }
        }
    });

    addTaskBtn.addEventListener('click', () => {
        taskForm.reset();
        taskForm.elements['task-id'].value = '';
        taskModalLabel.textContent = 'Add New Task';
        taskModal.show();
    });

    addTodoBtn.addEventListener('click', () => {
        todoModal.show(addTodoBtn);
    });
    
    todoModalEl.addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        const todoId = button?.dataset.id;

        const taskSelect = todoForm.elements['todo-task'];
        taskSelect.innerHTML = '<option value="none">-- No Task --</option>';
        allTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task._id;
            option.textContent = task.title;
            taskSelect.appendChild(option);
        });
        
        // **PERUBAHAN 1: Ambil elemen input tanggal**
        const startDateInput = todoForm.elements['todo-startDate'];
        const endDateInput = todoForm.elements['todo-endDate'];

        if (todoId) {
            // EDIT MODE
            todoModalLabel.textContent = 'Edit Todo';
            const todoToEdit = allTodos.find(t => t._id === todoId);
            if (todoToEdit) {
                todoForm.elements['todo-id'].value = todoToEdit._id;
                todoForm.elements['todo-title'].value = todoToEdit.title;
                taskSelect.value = todoToEdit.taskId || 'none';
                todoForm.elements['todo-description'].value = todoToEdit.description || '';
                todoForm.elements['todo-status'].value = todoToEdit.status;
                startDateInput.value = todoToEdit.startDate ? toLocalISOString(new Date(todoToEdit.startDate)) : '';
                endDateInput.value = todoToEdit.endDate ? toLocalISOString(new Date(todoToEdit.endDate)) : '';
                todoForm.elements['todo-location'].value = todoToEdit.location || '';
                todoForm.elements['todo-attendee'].value = todoToEdit.attendee || '';

                // **PERUBAHAN 2: Cek jika sudah ada di kalender, lalu disable input tanggal**
                if (todoToEdit.googleCalendarUrl) {
                    startDateInput.disabled = true;
                    endDateInput.disabled = true;
                } else {
                    startDateInput.disabled = false;
                    endDateInput.disabled = false;
                }
            }
        } else {
            // ADD MODE
            if (!currentUserData.isPremium && allTodos.length >= 10) {
                event.preventDefault(); 
                premiumModalMessage.textContent = 'You have reached the 10 todo limit for free accounts.';
                premiumModal.show();
                return;
            }
            todoModalLabel.textContent = 'Add New Todo';
            todoForm.reset();
            todoForm.elements['todo-id'].value = '';
            // **PERUBAHAN 3: Pastikan input tanggal aktif saat mode "Add"**
            startDateInput.disabled = false;
            endDateInput.disabled = false;
        }
    });

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = taskForm.elements['task-id'].value;
        const title = taskForm.elements['task-title'].value;
        try {
            if (id) {
                const updatedTask = await apiCall(`/tasks/${id}`, 'PUT', { title });
                const index = allTasks.findIndex(t => t._id === id);
                if (index !== -1) allTasks[index] = updatedTask;
            } else {
                const newTask = await apiCall('/tasks', 'POST', { title });
                allTasks.unshift(newTask);
            }
            taskModal.hide();
            renderTasksAndTodos();
        } catch (err) { alert(err.message); }
    });

    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = todoForm.elements['todo-id'].value;
        const taskId = todoForm.elements['todo-task'].value;
        
        // **PERUBAHAN 4: Cari todo original untuk mengecek status kalender**
        const originalTodo = id ? allTodos.find(t => t._id === id) : null;
        
        const payload = {
            title: todoForm.elements['todo-title'].value,
            description: todoForm.elements['todo-description'].value,
            status: todoForm.elements['todo-status'].value,
            location: todoForm.elements['todo-location'].value,
            attendee: todoForm.elements['todo-attendee'].value,
            taskId: taskId !== 'none' ? taskId : null,
        };
        
        // **PERUBAHAN 5: Hanya kirim tanggal jika todo BELUM ada di kalender**
        if (!originalTodo || !originalTodo.googleCalendarUrl) {
            payload.startDate = fromDateTimeLocal(todoForm.elements['todo-startDate'].value);
            payload.endDate = fromDateTimeLocal(todoForm.elements['todo-endDate'].value);
        }

        try {
            if (id) {
                const response = await apiCall(`/todo/${id}`, 'PUT', payload);
                const index = allTodos.findIndex(t => t._id === id);
                if (index !== -1) {
                    const savedTodo = response.updatedTodo || response.todo;
                    if (savedTodo) {
                        allTodos[index] = savedTodo;
                    }
                }
            } else {
                const response = await apiCall('/todo', 'POST', payload);
                const newTodo = response.todo || response.updatedTodo;
                if (newTodo) {
                    allTodos.unshift(newTodo);
                }
            }
            todoModal.hide();
            renderTasksAndTodos();
        } catch (err) { alert(err.message); }
    });
    
    // Profile & Subscription Listeners
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.submitter;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Updating...`;
        try {
            const payload = {
                username: profileForm.elements['profile-username'].value,
                email: profileForm.elements['profile-email'].value,
                password: profileForm.elements['profile-password'].value || undefined
            };
            await apiCall('/users/current', 'PUT', payload);
            showAlert(profileAlert, 'Profile updated successfully!', 'success');
            await fetchCurrentUser();
            populateProfileForm();
        } catch (err) { showAlert(profileAlert, err.message); } 
        finally { btn.disabled = false; btn.innerHTML = `Update Profile`; }
    });
    
    subscriptionStatusDiv.addEventListener('submit', async (e) => {
        if(e.target.id !== 'subscribe-form') return;
        e.preventDefault();
        const voucher = document.getElementById('voucher-input').value;
        const btn = e.submitter;
        const alertEl = document.getElementById('subscribe-alert');
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
        try {
            await apiCall('/users/subscribe', 'POST', { voucher });
            await fetchCurrentUser();
            renderSubscriptionStatus();
        } catch(err) {
            showAlert(alertEl, err.message, 'danger');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `Subscribe`;
        }
    });

    const populateProfileForm = () => {
        if (currentUserData) {
            profileForm.elements['profile-username'].value = currentUserData.username;
            profileForm.elements['profile-email'].value = currentUserData.email;
            profileForm.elements['profile-password'].value = '';
        }
    };

    goToProfileBtn.addEventListener('click', () => {
        premiumModal.hide();
        sidebarLinks.forEach(link => {
            if (link.dataset.view === 'profile-view') {
                handleNavigation({ preventDefault: () => {}, currentTarget: link });
            }
        });
    });

    // Chatbot and other initializations...
    const addChatMessage = (content, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.innerHTML = content;
        chatBox.insertBefore(msgDiv, typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;
    };
    const renderChatHistory = () => {
        chatBox.querySelectorAll('.chat-message:not(#typing-indicator)').forEach(el => el.remove());
        chatMessages.forEach(msg => addChatMessage(msg.content, msg.sender));
    };

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;
        addChatMessage(message, 'user');
        chatMessages.push({ sender: 'user', content: message });
        chatInput.value = ""; charCounter.textContent = '0/250'; typingIndicator.classList.remove('d-none');
        try {
            const data = await apiCall('/chat', 'POST', { sessionId: chatSessionId, message });
            const parsedContent = marked.parse(data.output);
            addChatMessage(parsedContent, 'bot');
            chatMessages.push({ sender: 'bot', content: parsedContent });
        } catch (err) { addChatMessage(`Error: ${err.message}`, 'bot'); } 
        finally { typingIndicator.classList.add('d-none'); saveChatState(); }
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
        if (todosString.length === 0) {
            recommendationResult.innerHTML = `<div class="alert alert-info">Your todo list is empty. Please add some todos to get recommendations.</div>`;
            generateRecommendationBtn.disabled = false;
            generateRecommendationBtn.innerHTML = originalButtonHTML;
            return;
        }

        const prompt = `
        You are a top-tier productivity assistant. Analyze the user's todo list and provide a **priority recommendation**.

        - Assign each task a priority: **High**, **Medium**, or **Low**.
        - Suggest the optimal order to tackle them.
        - Give a **brief reasoning** for each priority.
        - Format your response in **Markdown**, using headings and bullet points.

        User's Todos:
        ${todosString}
        `;

        try {
            const res = await apiCall('/chat', 'POST', {
                sessionId: `recommendation_${Date.now()}`,
                message: prompt
            });
            const parsedHtml = marked.parse(res.output);
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

    // --- Inisialisasi Aplikasi ---
    if (!chatSessionId) { chatSessionId = `session_${Date.now()}`; saveChatState(); }
    toggleViews();
});
