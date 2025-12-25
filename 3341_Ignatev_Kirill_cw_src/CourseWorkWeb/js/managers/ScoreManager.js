/**
 * Менеджер рекордов
 * Управляет сохранением и загрузкой таблицы рекордов
 */
export class ScoreManager {
    constructor() {
        this.scores = [];
        this.maxScores = 10;
        this.storageKey = 'gameHighScores';
    }

    /**
     * Загрузить рекорды из localStorage
     */
    loadScores() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.scores = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Ошибка загрузки рекордов:', error);
            this.scores = [];
        }
    }

    /**
     * Сохранить рекорды в localStorage
     */
    saveScores() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
        } catch (error) {
            console.error('Ошибка сохранения рекордов:', error);
        }
    }

    /**
     * Добавить новый результат
     * @param {string} name - Имя игрока
     * @param {number} score - Очки
     */
    addScore(name, score) {
        this.scores.push({
            name: name,
            score: score,
            date: new Date().toISOString()
        });

        // Сортировка по убыванию очков
        this.scores.sort((a, b) => b.score - a.score);

        // Ограничение количества рекордов
        if (this.scores.length > this.maxScores) {
            this.scores = this.scores.slice(0, this.maxScores);
        }
    }

    /**
     * Получить список рекордов
     * @returns {Array} Массив рекордов
     */
    getScores() {
        return this.scores;
    }

    /**
     * Очистить рекорды
     */
    clearScores() {
        this.scores = [];
        this.saveScores();
    }

    /**
     * Проверить, является ли результат рекордом
     * @param {number} score - Очки для проверки
     * @returns {boolean} true если это рекорд
     */
    isHighScore(score) {
        if (this.scores.length < this.maxScores) {
            return true;
        }
        return score > this.scores[this.scores.length - 1].score;
    }
}







