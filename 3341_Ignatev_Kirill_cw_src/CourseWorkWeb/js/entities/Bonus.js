import { Entity } from './Entity.js';

/**
 * Класс бонуса
 */
export class Bonus extends Entity {
    constructor(x, y, type = 'coin') {
        super(x, y, 32, 32);
        this.type = type; // 'coin', 'health', 'powerup'
        this.points = this.getPoints();
        this.animationTime = 0;
        this.collected = false;
        this.debugRendered = false; // Флаг для однократного вывода в консоль
        
        // Размеры для отрисовки маски (увеличенные)
        this.renderWidth = 64; // Увеличиваем размер отрисовки
        this.renderHeight = 64;
        
        // Загружаем спрайт маски
        this.sprite = null;
        this.loadSprite();
    }
    
    /**
     * Загрузить спрайт
     */
    async loadSprite() {
        try {
            const img = new Image();
            img.src = 'assets/MapAssets/samurai_mask.png';
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            this.sprite = img;
            // samurai_mask.png: используем весь спрайт как один кадр
            // Маска должна отображаться полностью, поэтому используем весь спрайт
            this.frameWidth = img.width;
            this.frameHeight = img.height;
            this.framesPerRow = 1;
            this.frameCount = 1;
            console.log('samurai_mask.png structure:', {
                width: img.width,
                height: img.height,
                frameWidth: this.frameWidth,
                frameHeight: this.frameHeight,
                framesPerRow: this.framesPerRow,
                frameCount: this.frameCount
            });
        } catch (error) {
            console.error('Ошибка загрузки спрайта samurai_mask.png:', error);
        }
    }

    /**
     * Получить очки за бонус
     */
    getPoints() {
        switch (this.type) {
            case 'coin': return 50;
            case 'health': return 100;
            case 'powerup': return 200;
            default: return 50;
        }
    }

    /**
     * Обновление бонуса
     */
    update(deltaTime) {
        this.animationTime += deltaTime;
    }

    /**
     * Отрисовка бонуса
     */
    render(ctx) {
        if (this.collected) return;

        // Если спрайт загружен, используем его
        if (this.sprite) {
            // Маска не должна двигаться - убираем bounce
            // Используем первый кадр (или можно сделать статичную анимацию)
            const frameIndex = 0; // Используем первый кадр, без анимации
            
            // Вычисляем координаты источника кадра в спрайтшите
            // Если это сетка, вычисляем позицию кадра
            const row = Math.floor(frameIndex / this.framesPerRow);
            const col = frameIndex % this.framesPerRow;
            const sourceX = col * this.frameWidth;
            const sourceY = row * this.frameHeight;
            
            // Рисуем маску с bounce анимацией
            // Область отображения на уровне хитбокса (совпадает с красным прямоугольником)
            // Добавляем bounce для анимации
            const bounce = Math.sin(this.animationTime * 0.08) * 4;
            const renderY = this.y + bounce;
            
            // ОТЛАДКА: Проверяем, что спрайт загружен и координаты правильные
            if (!this.debugRendered) {
                console.log('Bonus render debug:', {
                    spriteLoaded: !!this.sprite,
                    spriteSize: this.sprite ? `${this.sprite.width}x${this.sprite.height}` : 'N/A',
                    frameIndex: frameIndex,
                    row: row,
                    col: col,
                    sourceX: sourceX,
                    sourceY: sourceY,
                    frameWidth: this.frameWidth,
                    frameHeight: this.frameHeight,
                    renderX: this.x,
                    renderY: renderY,
                    renderWidth: this.width,
                    renderHeight: this.height
                });
                this.debugRendered = true;
            }
            
            // Отладочная информация (выводим один раз)
            if (!this.debugRendered) {
                console.log('Bonus debug info:', {
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                    spriteLoaded: !!this.sprite,
                    spriteSize: this.sprite ? `${this.sprite.width}x${this.sprite.height}` : 'N/A',
                    frameWidth: this.frameWidth,
                    frameHeight: this.frameHeight,
                    frameCount: this.frameCount,
                    renderY: renderY,
                    sourceX: sourceX,
                    sourceY: sourceY
                });
                this.debugRendered = true;
            }
            
            // Вычисляем смещения для центрирования относительно хитбокса
            const renderOffsetX = (this.width - this.renderWidth) / 2;
            const renderOffsetY = (this.height - this.renderHeight) / 2;
            
            // Рисуем спрайт
            // Масштабируем кадр до увеличенного размера (64x64), центрируем относительно хитбокса
            ctx.drawImage(
                this.sprite,
                sourceX, sourceY, // Источник: позиция кадра в спрайтшите
                this.frameWidth, this.frameHeight, // Размеры источника (весь кадр)
                this.x + renderOffsetX, renderY + renderOffsetY, // Координаты отрисовки (центрированные)
                this.renderWidth, this.renderHeight // Размеры отрисовки (64x64 - увеличенные)
            );
        } else {
            // Fallback: цветной круг (пока спрайт загружается)
            const bounce = Math.sin(this.animationTime * 0.1) * 3;
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + bounce);
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
}
