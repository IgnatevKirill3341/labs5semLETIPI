const appDiv = document.getElementById('app');

let currentScreen = null;
// let username = null; // УДАЛЯЕМ глобальную переменную username

function showLoginScreen() {
    currentScreen = 'login';
    appDiv.innerHTML = createLoginScreen(); // Функция из login.js
}

function showGameScreen() {
    currentScreen = 'game';
    // Получаем никнейм из localStorage
    const username = localStorage.getItem('username');
    appDiv.innerHTML = createGameScreen(username); // Функция из game.js
    startGame(); // Запускаем игру (из game.js)
}

function showLeaderboardScreen(score) {
    currentScreen = 'leaderboard';
    // Получаем никнейм из localStorage
    const username = localStorage.getItem('username');
    appDiv.innerHTML = createLeaderboardScreen(score, username); // Функция из leaderboard.js
}

// Инициализация
showLoginScreen();
