/**
 * Базовый класс для всех игровых сущностей
 */
export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.active = true;
    }

    /**
     * Обновление сущности
     * @param {number} deltaTime - Время с последнего кадра
     */
    update(deltaTime) {
        // Переопределяется в дочерних классах
    }

    /**
     * Отрисовка сущности
     * @param {CanvasRenderingContext2D} ctx - Контекст canvas
     */
    render(ctx) {
        // Переопределяется в дочерних классах
    }
}







