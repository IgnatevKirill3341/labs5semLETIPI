function createLoginScreen() {
    return `
        <h1>Tetris</h1>
        <input type="text" id="username" placeholder="Enter Nickname">
        <button onclick="login()">Start Game</button>
    `;
}

function login() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();

    if (username === "") {
        alert("Enter your Nickname!!!");
        return;
        
    } else if (username.length > 10){
        alert("Nickname must be < 10 chars!");
        return;
    }
    else {
        // Сохраняем никнейм
        localStorage.setItem('username', username);
        showGameScreen();
    }
}
