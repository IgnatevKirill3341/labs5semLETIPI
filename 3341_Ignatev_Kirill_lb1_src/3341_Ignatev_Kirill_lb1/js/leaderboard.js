const LEADERBOARD_KEY = 'tetrisLeaderboard';

function createLeaderboardScreen(score, username) {
    const leaderboard = getLeaderboard();

    // Проверяем, есть ли уже запись для этого пользователя
    const existingRecordIndex = leaderboard.findIndex(entry => entry.username === username);

    if (existingRecordIndex !== -1) {
        // Если запись существует, обновляем только если новый результат лучше
        if (score > leaderboard[existingRecordIndex].score) {
            leaderboard[existingRecordIndex].score = score;
        }
    } else {
        // Если записи нет, добавляем новый рекорд
        leaderboard.push({ username: username, score: score });
    }

    leaderboard.sort((a, b) => b.score - a.score); // Сортируем по убыванию

    // Ограничиваем таблицу 10 рекордами
    leaderboard.splice(10);

    saveLeaderboard(leaderboard);

    let tableRows = leaderboard.map(entry => `
        <tr>
            <td>${entry.username}</td>
            <td>${entry.score}</td>
        </tr>
    `).join('');

    return `
        <h1>High Scores</h1>
        <table>
            <thead>
                <tr>
                    <th>Nickname</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
        <button onclick="restartGame()">Restart</button>
        <button onclick="goToLogin()">Quit</button>
    `;
}

function getLeaderboard() {
    const leaderboardString = localStorage.getItem(LEADERBOARD_KEY);
    return leaderboardString ? JSON.parse(leaderboardString) : [];
}

function saveLeaderboard(leaderboard) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

function restartGame() {
    showGameScreen(); // Начинаем игру с тем же никнеймом
}

function goToLogin() {
    showLoginScreen(); // Возвращаемся на экран логина
}

