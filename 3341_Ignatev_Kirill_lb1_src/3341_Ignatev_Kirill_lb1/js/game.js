let gameContext;
let nextTetraminoCanvas;
let nextTetraminoContext;

let gameLoopInterval;
let isPaused = false;

// Размеры поля (в клетках)
const FIELD_WIDTH = 10;
const FIELD_HEIGHT = 20;
const CELL_SIZE = 20; // Размер одной клетки в пикселях

// Неоновые цвета в стиле 80-х
const TETRAMINO_COLORS = {
    'I': '#00FFFF',     // Неоновый голубой
    'J': '#1E90FF',     // Яркий синий
    'L': '#FF8C00',     // Неоновый оранжевый
    'O': '#FFFF00',     // Неоновый желтый
    'S': '#32CD32',     // Ярко-зеленый
    'T': '#EE82EE',     // Неоновый фиолетовый
    'Z': '#DC143C'      // Неоновый красный
};

const GHOST_TETRAMINO_COLORS = {
    '#00FFFF': 'rgba(0, 255, 255, 0.3)',  // Полупрозрачный голубой
    '#1E90FF': 'rgba(30, 144, 255, 0.3)', // Полупрозрачный синий
    '#FF8C00': 'rgba(255, 140, 0, 0.3)',  // Полупрозрачный оранжевый
    '#FFFF00': 'rgba(255, 255, 0, 0.3)',  // Полупрозрачный желтый
    '#32CD32': 'rgba(50, 205, 50, 0.3)',  // Полупрозрачный зеленый
    '#EE82EE': 'rgba(238, 130, 238, 0.3)',// Полупрозрачный фиолетовый
    '#DC143C': 'rgba(220, 20, 60, 0.3)'   // Полупрозрачный красный
};

// Игровое поле
let field = [];

// Текущая фигура
let currentTetramino = null;

// Следующая фигура
let nextTetramino = null;

// Счет
let score = 0;
// Линии
let lines = 0;
// Уровень
let level = 1;
function createGameScreen(username) {
    return `
        <div id="game-container">
            <div id="game-info">
                <h2>${username}</h2>
                <div id="score-display">
                    <span>SCORE</span>
                    <div id="score">00000</div>
                </div>
                <div id="lines-display">
                    <span>LINES</span>
                    <div id="lines">00</div>
                </div>
                <div id="level-display">
                    <span>LEVEL</span>
                    <div id="level">01</div>
                </div>
                <button id="start-pause-button" onclick="togglePause()">START</button>
                <div id="controls">
                    <h3>CONTROLS:</h3>
                    <p>↑ ROTATE</p>
                    <p>↓ FAST DROP</p>
                    <p>← → MOVE</p>
                </div>
            </div>
            <div id="game-area">
                <canvas id="game-canvas" width="${FIELD_WIDTH * CELL_SIZE}" height="${FIELD_HEIGHT * CELL_SIZE}"></canvas>
            </div>
            <div id="next-piece">
                <h3>NEXT</h3>
                <canvas id="next-tetramino" width="100" height="100"></canvas>
            </div>
        </div>
    `;
}

function startGame() {
    gameCanvas = document.getElementById('game-canvas');
    gameContext = gameCanvas.getContext('2d');
    nextTetraminoCanvas = document.getElementById('next-tetramino');
    nextTetraminoContext = nextTetraminoCanvas.getContext('2d');
    // Сброс показателей счета, уничтоженных линий и уровня
    score = 0;
    lines = 0;
    level = 1;
    // Инициализация поля
    field = createEmptyField(FIELD_WIDTH, FIELD_HEIGHT);

    // Создаем первую и следующую фигуры
    currentTetramino = getRandomTetramino();
    nextTetramino = getRandomTetramino();

    // Обработчики событий клавиатуры
    document.addEventListener('keydown', handleKeyDown);

    // Обновляем отображение уровня
    if (document.getElementById('level')) {
        document.getElementById('level').innerText = String(level).padStart(2, '0');
    }
    
    // Запускаем игровой цикл
    updateGameSpeed();
    togglePause();
}

function createEmptyField(width, height) {
    let field = [];
    for (let y = 0; y < height; y++) {
        field[y] = [];
        for (let x = 0; x < width; x++) {
            field[y][x] = 0;
        }
    }
    return field;
}

function getRandomTetramino() {
    const tetraminoTypes = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const randomIndex = Math.floor(Math.random() * tetraminoTypes.length);
    const type = tetraminoTypes[randomIndex];
    const color = TETRAMINO_COLORS[type];
    return new Tetramino(type, color);
}

function gameLoop() {
    if (!isPaused) {
        updateGame();
        drawGame();
    }
}

function updateGame() {
    if (canMoveDown()) {
        currentTetramino.y++;
    } else {
        freezeTetramino();
        console.log("Вызов updateGame");
        clearLines();

        currentTetramino = nextTetramino;
        nextTetramino = getRandomTetramino();

        if (!canMoveDown()) {
            endGame();
        }
    }
}

function canMoveDown() {
    for (let y = 0; y < currentTetramino.shape.length; y++) {
        for (let x = 0; x < currentTetramino.shape[y].length; x++) {
            if (currentTetramino.shape[y][x]) {
                let nextY = currentTetramino.y + y + 1;
                let nextX = currentTetramino.x + x;

                if (nextY >= FIELD_HEIGHT || field[nextY][nextX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function freezeTetramino() {
    for (let y = 0; y < currentTetramino.shape.length; y++) {
        for (let x = 0; x < currentTetramino.shape[y].length; x++) {
            if (currentTetramino.shape[y][x]) {
                field[currentTetramino.y + y][currentTetramino.x + x] = currentTetramino.color;
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let y = FIELD_HEIGHT - 1; y >= 0; y--) {
        let rowFilled = true;
        for (let x = 0; x < FIELD_WIDTH; x++) {
            if (!field[y][x]) {
                rowFilled = false;
                break;
            }
        }

        if (rowFilled) {
            for (let yy = y; yy > 0; yy--) {
                field[yy] = field[yy - 1].slice();
            }
            field[0] = new Array(FIELD_WIDTH).fill(0);
            score += 100;
            lines += 1;
            linesCleared += 1;
            y++;
        }
    }
    
    // Повышение уровня при очистке линии
    if (linesCleared > 0) {
        level += linesCleared;
        updateGameSpeed();
        document.getElementById('level').innerText = String(level).padStart(2, '0');
    }
    
    // Обновление отображения
    document.getElementById('score').innerText = String(score).padStart(5, '0');
    document.getElementById('lines').innerText = String(lines).padStart(2, '0');
}

function updateGameSpeed() {
    // Уменьшаем интервал с каждым уровнем (игра становится быстрее)
    // Базовая скорость: 500ms, минимальная: 50ms
    // Формула: интервал = max(50, 500 - (level - 1) * 30)
    const baseSpeed = 500;
    const minSpeed = 50;
    const speedDecrease = 30;
    const newInterval = Math.max(minSpeed, baseSpeed - (level - 1) * speedDecrease);
    
    // Обновляем интервал игрового цикла
    clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, newInterval);
}

function drawGame() {
    // Очистка с неоновым свечением
    gameContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
    gameContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    drawField();
    const ghostTetramino = getGhostTetramino();
    drawGhostTetramino(ghostTetramino, gameContext);
    drawTetramino(currentTetramino, gameContext);
    drawNextTetramino();
}

function drawField() {
    for (let y = 0; y < FIELD_HEIGHT; y++) {
        for (let x = 0; x < FIELD_WIDTH; x++) {
            if (field[y][x]) {
                // Основной цвет блока
                gameContext.fillStyle = field[y][x];
                gameContext.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                
                // Неоновое свечение
                gameContext.shadowColor = field[y][x];
                gameContext.shadowBlur = 10;
                gameContext.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                gameContext.shadowBlur = 0;
                
                // Сетка внутри блока
                gameContext.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                gameContext.lineWidth = 1;
                gameContext.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else {
                // Фон пустой клетки с пиксельной сеткой
                gameContext.fillStyle = 'rgba(20, 20, 20, 0.5)';
                gameContext.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                
                gameContext.strokeStyle = 'rgba(80, 80, 80, 0.3)';
                gameContext.lineWidth = 1;
                gameContext.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function drawTetramino(tetramino, context) {
    if (!tetramino) return;

    for (let y = 0; y < tetramino.shape.length; y++) {
        for (let x = 0; x < tetramino.shape[y].length; x++) {
            if (tetramino.shape[y][x]) {
                // Основной блок
                context.fillStyle = tetramino.color;
                context.fillRect((tetramino.x + x) * CELL_SIZE, (tetramino.y + y) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                
                // Неоновое свечение
                context.shadowColor = tetramino.color;
                context.shadowBlur = 15;
                context.fillRect((tetramino.x + x) * CELL_SIZE, (tetramino.y + y) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                context.shadowBlur = 0;
                
                // Контур
                context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                context.lineWidth = 1;
                context.strokeRect((tetramino.x + x) * CELL_SIZE, (tetramino.y + y) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function drawNextTetramino() {
    nextTetraminoContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
    nextTetraminoContext.fillRect(0, 0, nextTetraminoCanvas.width, nextTetraminoCanvas.height);

    if (!nextTetramino) return;

    const maxTetraminoSize = 4;
    const canvasCenterX = nextTetraminoCanvas.width / 2;
    const canvasCenterY = nextTetraminoCanvas.height / 2;

    const tetraminoWidth = nextTetramino.shape[0].length;
    const tetraminoHeight = nextTetramino.shape.length;

    const offsetX = canvasCenterX - (tetraminoWidth * CELL_SIZE / 2);
    const offsetY = canvasCenterY - (tetraminoHeight * CELL_SIZE / 2);

    for (let y = 0; y < nextTetramino.shape.length; y++) {
        for (let x = 0; x < nextTetramino.shape[y].length; x++) {
            if (nextTetramino.shape[y][x]) {
                nextTetraminoContext.fillStyle = nextTetramino.color;
                nextTetraminoContext.fillRect(offsetX + x * CELL_SIZE, offsetY + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                
                nextTetraminoContext.shadowColor = nextTetramino.color;
                nextTetraminoContext.shadowBlur = 10;
                nextTetraminoContext.fillRect(offsetX + x * CELL_SIZE, offsetY + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                nextTetraminoContext.shadowBlur = 0;
                
                nextTetraminoContext.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                nextTetraminoContext.lineWidth = 1;
                nextTetraminoContext.strokeRect(offsetX + x * CELL_SIZE, offsetY + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function handleKeyDown(event) {
    switch (event.key) {
        case 'ArrowUp':
            rotateTetramino();
            break;
        case 'ArrowDown':
            dropTetramino();
            break;
        case 'ArrowLeft':
            moveTetramino(-1);
            break;
        case 'ArrowRight':
            moveTetramino(1);
            break;
    }
}

function rotateTetramino() {
    const originalShape = currentTetramino.shape;
    currentTetramino.rotate();
    if (isCollision()) {
        currentTetramino.shape = originalShape;
    }
}

function isCollision() {
    for (let y = 0; y < currentTetramino.shape.length; y++) {
        for (let x = 0; x < currentTetramino.shape[y].length; x++) {
            if (currentTetramino.shape[y][x]) {
                let newX = currentTetramino.x + x;
                let newY = currentTetramino.y + y;

                if (newX < 0 || newX >= FIELD_WIDTH || newY >= FIELD_HEIGHT || field[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

function moveTetramino(direction) {
    currentTetramino.x += direction;
    if (isCollision()) {
        currentTetramino.x -= direction;
    }
}

function dropTetramino() {
    while(canMoveDown()) {
        currentTetramino.y++;
    }
    updateGame();
    drawGame();
}

function getGhostTetramino() {
    const ghostTetramino = {
        ...currentTetramino,
        color: GHOST_TETRAMINO_COLORS[currentTetramino.color] || 'rgba(128, 128, 128, 0.3)'
    };

    while (canMoveGhostDown(ghostTetramino)) {
        ghostTetramino.y++;
    }

    return ghostTetramino;
}

function canMoveGhostDown(ghostTetramino) {
    for (let y = 0; y < ghostTetramino.shape.length; y++) {
        for (let x = 0; x < ghostTetramino.shape[y].length; x++) {
            if (ghostTetramino.shape[y][x]) {
                let nextY = ghostTetramino.y + y + 1;
                let nextX = ghostTetramino.x + x;

                if (nextY >= FIELD_HEIGHT || field[nextY][nextX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function drawGhostTetramino(ghostTetramino, context) {
    for (let y = 0; y < ghostTetramino.shape.length; y++) {
        for (let x = 0; x < ghostTetramino.shape[y].length; x++) {
            if (ghostTetramino.shape[y][x]) {
                context.fillStyle = ghostTetramino.color;
                context.fillRect((ghostTetramino.x + x) * CELL_SIZE, (ghostTetramino.y + y) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                
                context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                context.lineWidth = 1;
                context.strokeRect((ghostTetramino.x + x) * CELL_SIZE, (ghostTetramino.y + y) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function togglePause() {
    isPaused = !isPaused;
    const button = document.getElementById('start-pause-button');
    button.innerText = isPaused ? "CONTINUE" : "PAUSE";
}

function endGame() {
    clearInterval(gameLoopInterval);
    document.removeEventListener('keydown', handleKeyDown);
    showLeaderboardScreen(score);
}
