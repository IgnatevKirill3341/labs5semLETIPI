import { Entity } from './Entity.js';

/**
 * Класс дерева для декорации
 */
export class Tree extends Entity {
    constructor(x, y, treeType = 'medium') {
        // Размеры зависят от типа дерева
        let width, height;
        switch(treeType) {
            case 'large':
                width = 96;
                height = 128;
                break;
            case 'medium':
                width = 64;
                height = 96;
                break;
            case 'small':
                width = 48;
                height = 64;
                break;
            default:
                width = 64;
                height = 96;
        }
        
        super(x, y, width, height);
        this.treeType = treeType;
        this.sprite = null;
        this.spriteX = 0; // Позиция спрайта в Objects.png
        this.spriteY = 0;
        this.spriteWidth = width;
        this.spriteHeight = height;
        this.loadSprite();
    }
    
    /**
     * Загрузить спрайт дерева из Objects.png
     */
    async loadSprite() {
        try {
            const img = new Image();
            img.src = 'assets/MapAssets/Objects.png';
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            this.sprite = img;
            
            // Определяем позицию спрайта в зависимости от типа дерева
            // В Objects.png деревья расположены в левой части
            switch(this.treeType) {
                case 'large':
                    // Большие деревья в левой части (0-96, 0-128)
                    this.spriteX = 0;
                    this.spriteY = 0;
                    break;
                case 'medium':
                    // Средние деревья (96-160, 0-96)
                    this.spriteX = 96;
                    this.spriteY = 0;
                    break;
                case 'small':
                    // Маленькие деревья (160-208, 0-64)
                    this.spriteX = 160;
                    this.spriteY = 0;
                    break;
            }
        } catch (error) {
            console.error('Ошибка загрузки спрайта дерева:', error);
        }
    }

    /**
     * Обновление дерева
     */
    update(deltaTime) {
        // Деревья статичны, не требуют обновления
    }

    /**
     * Отрисовка дерева
     */
    render(ctx) {
        if (this.sprite) {
            // В Tiled для объектов координата Y - это обычно верхняя точка (верхний левый угол)
            // Но для декоративных элементов (деревьев) часто используется нижняя точка (основание)
            // Если рендерится только нижняя половина дерева, значит Y - это нижняя точка
            // Нужно рендерить дерево так, чтобы его основание было на Y, а верх был выше
            // То есть renderY = Y - height (дерево растет вверх от Y)
            const renderY = this.y - this.height;
            
            // Рисуем дерево полностью - оно должно быть полностью видно на экране
            ctx.drawImage(
                this.sprite,
                this.spriteX, this.spriteY,
                this.spriteWidth, this.spriteHeight,
                this.x, renderY,
                this.width, this.height
            );
        } else {
            // Fallback: простой прямоугольник
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x, this.y - 30, this.width / 3, 30);
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y - 50, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

