// Import styles for webpack build
import '../less/styles.less';

const API_BASE = 'https://localhost:3443/api';

// Default placeholder photo URL
const DEFAULT_PHOTO = 'https://ui-avatars.com/api/?size=150&background=0d6efd&color=fff';

// Generate avatar URL from user name
function generateAvatarUrl(firstName, lastName, middleName) {
    const name = [lastName, firstName, middleName].filter(Boolean).join('+');
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=0d6efd&color=fff`;
}

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if user is 18 years or older
function isAdult(dateOfBirth) {
    if (!dateOfBirth) return false;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age >= 18;
}

// Load users on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupEventListeners();
});

function setupEventListeners() {
    // Setup form submit handler
    const form = document.getElementById('userForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveUser();
        });
    }
    
    // Setup reset button
    const resetBtn = document.querySelector('button[onclick="resetForm()"]');
    if (resetBtn) {
        resetBtn.onclick = resetForm;
    }
    
    // Setup save button
    const saveBtn = document.querySelector('button[onclick="saveUser()"]');
    if (saveBtn) {
        saveBtn.onclick = saveUser;
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        
        const data = await response.json();
        displayUsers(data.users);
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Ошибка загрузки пользователей');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        const fullName = `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim();
        const roleText = user.role === 'admin' ? 'Администратор' : 'Пользователь';
        const statusText = getStatusText(user.status);
        const statusClass = getStatusClass(user.status);
        
        const photoUrl = user.photo || generateAvatarUrl(user.firstName, user.lastName, user.middleName);
        row.innerHTML = `
            <td><img src="${photoUrl}" alt="Photo" class="user-photo"></td>
            <td>${fullName}</td>
            <td>${user.email}</td>
            <td>${roleText}</td>
            <td><span class="badge bg-${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-sm btn-primary edit-btn" data-user-id="${user.id}">Редактировать</button>
                <button class="btn btn-sm btn-danger delete-btn" data-user-id="${user.id}">Удалить</button>
            </td>
        `;
        
        // Add event listeners
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        editBtn.addEventListener('click', () => editUser(user.id));
        deleteBtn.addEventListener('click', () => deleteUser(user.id));
        
        tbody.appendChild(row);
    });
}

function getStatusText(status) {
    const statusMap = {
        'unconfirmed': 'Не подтверждённый',
        'active': 'Активный',
        'blocked': 'Заблокированный'
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const classMap = {
        'unconfirmed': 'warning',
        'active': 'success',
        'blocked': 'danger'
    };
    return classMap[status] || 'secondary';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function resetForm() {
    const formTitle = document.getElementById('formTitle');
    const formTitleCard = document.getElementById('formTitleCard');
    const addUserBtn = document.getElementById('addUserBtn');
    
    if (formTitle) formTitle.textContent = 'Добавить пользователя';
    if (formTitleCard) formTitleCard.textContent = 'Добавить пользователя';
    if (addUserBtn) addUserBtn.style.display = 'none';
    
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
}

async function editUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load user');
        }
        
        const user = await response.json();
        
        const formTitle = document.getElementById('formTitle');
        const formTitleCard = document.getElementById('formTitleCard');
        const addUserBtn = document.getElementById('addUserBtn');
        
        if (formTitle) formTitle.textContent = 'Редактировать пользователя';
        if (formTitleCard) formTitleCard.textContent = 'Редактировать пользователя';
        if (addUserBtn) addUserBtn.style.display = 'block';
        
        document.getElementById('userId').value = user.id;
        document.getElementById('firstName').value = user.firstName;
        document.getElementById('lastName').value = user.lastName;
        document.getElementById('middleName').value = user.middleName || '';
        document.getElementById('dateOfBirth').value = user.dateOfBirth;
        document.getElementById('email').value = user.email;
        document.getElementById('role').value = user.role;
        document.getElementById('status').value = user.status;
        
        // Прокрутить к форме
        document.querySelector('.user-form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('Error loading user:', error);
        alert('Ошибка загрузки пользователя');
    }
}

async function saveUser() {
    const userId = document.getElementById('userId').value;
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const middleName = document.getElementById('middleName').value.trim();
    const email = document.getElementById('email').value.trim();
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    
    // Clear previous error messages
    document.getElementById('emailError').textContent = '';
    document.getElementById('ageError').textContent = '';
    document.getElementById('email').classList.remove('is-invalid');
    document.getElementById('dateOfBirth').classList.remove('is-invalid');
    
    let hasErrors = false;
    
    // Validate email
    if (!validateEmail(email)) {
        document.getElementById('emailError').textContent = 'Введите корректный email адрес';
        document.getElementById('email').classList.add('is-invalid');
        hasErrors = true;
    }
    
    // Validate age (only for new users, not when editing)
    if (!userId && !isAdult(dateOfBirth)) {
        document.getElementById('ageError').textContent = 'Пользователь должен быть старше 18 лет';
        document.getElementById('dateOfBirth').classList.add('is-invalid');
        hasErrors = true;
    }
    
    if (hasErrors) {
        return;
    }
    
    // Generate avatar from name (photo field removed from form)
    const photo = generateAvatarUrl(firstName, lastName, middleName);
    
    const userData = {
        firstName: firstName,
        lastName: lastName,
        middleName: middleName,
        dateOfBirth: dateOfBirth,
        email: email,
        photo: photo,
        role: document.getElementById('role').value,
        status: document.getElementById('status').value
    };
    
    try {
        const url = userId ? `${API_BASE}/users/${userId}` : `${API_BASE}/users`;
        const method = userId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save user');
        }
        
        // Сбросить форму после успешного сохранения
        resetForm();
        loadUsers();
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Ошибка сохранения пользователя');
    }
}

async function deleteUser(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete user');
        }
        
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Ошибка удаления пользователя');
    }
}

// Make functions globally available for onclick handlers
window.saveUser = saveUser;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.resetForm = resetForm;

