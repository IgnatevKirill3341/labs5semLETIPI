import { Entity } from './Entity.js';

/**
 * Класс врат для перехода на следующий уровень
 */
export class Gate extends Entity {
    constructor(x, y, width, height, gameManager) {
        super(x, y, width, height);
        this.gameManager = gameManager;
        this.isOpen = false;
        this.color = '#8B4513'; // Коричневый цвет для закрытых ворот
        this.openColor = '#00FF00'; // Зеленый цвет для открытых ворот
    }

    /**
     * Открыть ворота
     */
    open() {
        this.isOpen = true;
    }

    /**
     * Проверка, открыты ли ворота
     */
    checkOpen() {
        // Ворота открываются, когда все враги побеждены (мертвы)
        const aliveEnemies = this.gameManager.enemies.filter(enemy => !enemy.isDead);
        if (aliveEnemies.length === 0 && !this.isOpen) {
            this.open();
        } else if (aliveEnemies.length > 0 && this.isOpen) {
            // Если есть живые враги, но ворота открыты - закрываем их (на случай перезапуска)
            this.isOpen = false;
        }
    }

    /**
     * Отрисовка ворот
     */
    render(ctx) {
        ctx.fillStyle = this.isOpen ? this.openColor : this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Обводка
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Текст на воротах
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            this.isOpen ? 'ВЫХОД' : 'ЗАКРЫТО',
            this.x + this.width / 2,
            this.y + this.height / 2 + 5
        );
    }
}


