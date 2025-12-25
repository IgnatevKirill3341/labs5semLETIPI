// Import styles for webpack build
import '../less/styles.less';

const API_BASE = 'https://localhost:3443/api';

let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
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
        populateUserSelect();
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Ошибка загрузки пользователей');
    }
}

function populateUserSelect() {
    const select = document.getElementById('userSelect');
    select.innerHTML = '<option value="">Выберите пользователя</option>';
    
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim();
        select.appendChild(option);
    });
}

async function loadFriends() {
    const userId = document.getElementById('userSelect').value;
    
    if (!userId) {
        document.getElementById('friendsContainer').innerHTML = 
            '<div class="alert alert-info">Выберите пользователя для просмотра списка друзей</div>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/friends/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load friends');
        }
        
        const data = await response.json();
        displayFriends(data.friends, userId);
    } catch (error) {
        console.error('Error loading friends:', error);
        alert('Ошибка загрузки друзей');
    }
}

function displayFriends(friendIds, currentUserId) {
    const container = document.getElementById('friendsContainer');
    
    if (friendIds.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">У этого пользователя пока нет друзей</div>';
        return;
    }
    
    const friends = allUsers.filter(user => friendIds.includes(user.id));
    const currentUser = allUsers.find(u => u.id === parseInt(currentUserId));
    
    let html = `
        <div class="mb-3">
            <h3>Друзья пользователя: ${currentUser.lastName} ${currentUser.firstName}</h3>
        </div>
        <div class="row">
    `;
    
    friends.forEach(friend => {
        const fullName = `${friend.lastName} ${friend.firstName} ${friend.middleName || ''}`.trim();
        html += `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <img src="${friend.photo || 'https://via.placeholder.com/80'}" 
                                 alt="Photo" 
                                 class="friend-photo me-3">
                            <div>
                                <h5 class="card-title">${fullName}</h5>
                                <p class="card-text mb-1">${friend.email}</p>
                                <p class="card-text">
                                    <small class="text-muted">${formatDate(friend.dateOfBirth)}</small>
                                </p>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-danger mt-2" 
                                onclick="removeFriend(${currentUserId}, ${friend.id})">
                            Удалить из друзей
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

async function removeFriend(userId1, userId2) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя из друзей?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/friends/${userId1}/${userId2}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to remove friend');
        }
        
        loadFriends();
    } catch (error) {
        console.error('Error removing friend:', error);
        alert('Ошибка удаления друга');
    }
}

