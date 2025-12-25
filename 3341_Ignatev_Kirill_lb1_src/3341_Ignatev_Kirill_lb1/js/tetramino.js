class Tetramino {
    constructor(type, color) {
        this.type = type; // Уже есть
        this.color = color; // Уже есть
        this.x = 3; // Начальная позиция
        this.y = 0;
        this.rotation = 0; // Текущая ориентация
        this.shape = this.getShape();
    }
    getShape() {
        switch (this.type) {
            case 'I':
                return [[1, 1, 1, 1]];
            case 'J':
                return [[1, 0, 0], [1, 1, 1]];
            case 'L':
                return [[0, 0, 1], [1, 1, 1]];
            case 'O':
                return [[1, 1], [1, 1]];
            case 'S':
                return [[0, 1, 1], [1, 1, 0]];
            case 'T':
                return [[0, 1, 0], [1, 1, 1]];
            case 'Z':
                return [[1, 1, 0], [0, 1, 1]];
            default:
                return [[1]];
        }
    }

    rotate() {
        const rows = this.shape.length;
        const cols = this.shape[0].length;
        const newShape = [];

        for (let x = 0; x < cols; x++) {
            newShape[x] = [];
            for (let y = 0; y < rows; y++) {
                newShape[x][rows - 1 - y] = this.shape[y][x];
            }
        }
        this.shape = newShape;
    }
}
