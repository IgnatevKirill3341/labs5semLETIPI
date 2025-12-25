// Import styles for webpack build
import '../less/styles.less';

const API_BASE = 'https://localhost:3443/api';

let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadNews();
});

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
        allUsers = data.users;
        populateUserFilter();
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Ошибка загрузки пользователей');
    }
}

function populateUserFilter() {
    const select = document.getElementById('userFilter');
    select.innerHTML = '<option value="">Все пользователи</option>';
    
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim();
        select.appendChild(option);
    });
}

async function loadNews() {
    const userId = document.getElementById('userFilter').value;
    const url = userId ? `${API_BASE}/news?userId=${userId}` : `${API_BASE}/news`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load news');
        }
        
        const data = await response.json();
        displayNews(data.news);
    } catch (error) {
        console.error('Error loading news:', error);
        alert('Ошибка загрузки новостей');
    }
}

function displayNews(news) {
    const container = document.getElementById('newsContainer');
    
    if (news.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Новостей не найдено</div>';
        return;
    }
    
    let html = '<div class="row">';
    
    news.forEach(item => {
        const author = allUsers.find(u => u.id === item.authorId);
        const authorName = author 
            ? `${author.lastName} ${author.firstName} ${author.middleName || ''}`.trim()
            : 'Неизвестный пользователь';
        const statusBadge = item.isActive 
            ? '<span class="badge bg-success">Активна</span>'
            : '<span class="badge bg-danger">Заблокирована</span>';
        
        html += `
            <div class="col-md-6 mb-4">
                <div class="card ${item.isActive ? '' : 'border-danger'}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span>${authorName}</span>
                        ${statusBadge}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${item.title}</h5>
                        <p class="card-text">${item.content}</p>
                        <p class="card-text">
                            <small class="text-muted">${formatDateTime(item.createdAt)}</small>
                        </p>
                        <button class="btn btn-sm ${item.isActive ? 'btn-warning' : 'btn-success'}" 
                                onclick="toggleNewsStatus(${item.id})">
                            ${item.isActive ? 'Заблокировать' : 'Активировать'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
}

async function toggleNewsStatus(newsId) {
    try {
        const response = await fetch(`${API_BASE}/news/${newsId}/toggle`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to toggle news status');
        }
        
        loadNews();
    } catch (error) {
        console.error('Error toggling news status:', error);
        alert('Ошибка изменения статуса новости');
    }
}

