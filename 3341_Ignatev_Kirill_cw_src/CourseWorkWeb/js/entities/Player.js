import { Entity } from './Entity.js';

/**
 * Класс игрока
 */
export class Player extends Entity {
    constructor(x, y, gameManager) {
        // Физические размеры для коллизий (меньше для лучшей проходимости)
        super(x, y, 40, 50);
        this.gameManager = gameManager;
        
        // Размеры для отрисовки спрайта (больше, чем хитбокс)
        this.renderWidth = 64;
        this.renderHeight = 64;
        
        // Смещение для центрирования спрайта относительно хитбокса
        this.renderOffsetX = (this.renderWidth - this.width) / 2;
        this.renderOffsetY = (this.renderHeight - this.height) / 2;
        
        this.speed = 5;
        this.jumpPower = -22; // Увеличена высота прыжка (более отрицательное значение = выше прыжок)
        this.onGround = false;
        this.direction = 1; // 1 - вправо, -1 - влево

        // Спрайты
        this.sprites = null;
        this.attackSprite = null; // Отдельный спрайт для эффекта атаки
        this.currentAnimation = 'idle';
        this.currentFrame = 0; // Текущий кадр анимации
        this.frameTimer = 0; // Таймер для смены кадров
        this.attackFrame = 0; // Кадр анимации атаки
        this.attackFrameTimer = 0; // Таймер для анимации атаки

        // Состояние атаки
        this.isAttacking = false;
        this.attackType = 1; // 1, 2, или 3
        this.attackTime = 0;
        this.attackDuration = 300; // мс
        this.hitEnemies = new Set(); // Враги, по которым уже нанесен урон в текущей атаке
        this.lastAttackTime = 0;
        this.attackComboWindow = 500; // окно для комбо в мс
        this.attackComboCount = 0;

        // Состояние неуязвимости
        this.isInvincible = false;
        this.invincibilityTime = 0;
        this.invincibilityDuration = 1000; // 1 секунда в мс

        // Состояние смерти
        this.isDead = false;
        this.deathAnimationTime = 0;
        this.deathAnimationDuration = 2000; // 2 секунды для анимации смерти

        // Физика
        this.physics = {
            velocityX: 0,
            velocityY: 0,
            gravity: true,
            airResistance: false,
            maxVelocity: 10
        };

        // Загрузка спрайтов
        this.loadSprites();
        this.lastAnimation = 'idle';
    }

    /**
     * Загрузка спрайтов
     */
    async loadSprites() {
        if (this.gameManager.spriteManager) {
            this.sprites = await this.gameManager.spriteManager.loadCharacterSprites('Samurai_Commander');
            // Загружаем отдельный спрайт для эффекта атаки
            const attackImg = await this.gameManager.spriteManager.loadSprite('assets/Attacks/BigSlashV.png');
            this.attackSprite = {
                image: attackImg,
                frameWidth: attackImg.height || 64, // Предполагаем квадратные кадры
                frameHeight: attackImg.height || 64,
                frameCount: Math.max(1, Math.floor(attackImg.width / (attackImg.height || 64))),
                frameDuration: 50 // Быстрая анимация эффекта
            };
        }
    }

    /**
     * Движение влево
     */
    moveLeft() {
        if (this.isDead) return; // Нельзя двигаться при смерти
        this.physics.velocityX = -this.speed;
        this.direction = -1;
    }

    /**
     * Движение вправо
     */
    moveRight() {
        if (this.isDead) return; // Нельзя двигаться при смерти
        this.physics.velocityX = this.speed;
        this.direction = 1;
    }

    /**
     * Прыжок
     */
    jump() {
        if (this.isDead) return; // Нельзя прыгать при смерти
        if (this.onGround && !this.isAttacking) {
            this.physics.velocityY = this.jumpPower;
            this.onGround = false;
            this.currentAnimation = 'jump';
            this.gameManager.soundManager.playSound('jump');
        }
    }

    /**
     * Атака
     */
    attack() {
        if (this.isAttacking) return;

        // Сбрасываем список пораженных врагов для новой атаки
        this.hitEnemies.clear();

        const now = Date.now();
        const timeSinceLastAttack = now - this.lastAttackTime;

        // Если прошло меньше времени чем окно комбо и был быстрый клик - чередуем атаки
        if (timeSinceLastAttack < this.attackComboWindow && timeSinceLastAttack > 0) {
            this.attackComboCount++;
            // Чередуем между 1, 2, 3
            this.attackType = (this.attackComboCount % 3) + 1;
        } else {
            // Медленное нажатие - начинаем с первой атаки
            this.attackComboCount = 0;
            this.attackType = 1;
        }

        this.isAttacking = true;
        this.attackTime = 0;
        this.currentAnimation = `attack${this.attackType}`;
        this.lastAttackTime = now;
        
        // Воспроизводим звук атаки
        if (this.gameManager && this.gameManager.soundManager) {
            this.gameManager.soundManager.playSound('attack');
        }
    }

    /**
     * Проверка попадания атаки по врагам
     * Вызывается в игровом цикле
     */
    checkAttackHit() {
        if (!this.isAttacking || !this.gameManager.enemies) return;

        const attackRange = 80;
        const attackOffsetX = this.direction > 0 ? this.width : -attackRange;
        const attackBox = {
            x: this.x + attackOffsetX,
            y: this.y,
            width: attackRange,
            height: this.height
        };

        this.gameManager.enemies.forEach((enemy, index) => {
            // Проверяем, не наносили ли уже урон этому врагу в текущей атаке
            if (this.hitEnemies.has(enemy)) return;
            
            if (!enemy.isDead && this.gameManager.physicsManager.checkCollision(attackBox, enemy)) {
                // Наносим урон врагу только один раз за атаку
                enemy.takeDamage(1);
                this.hitEnemies.add(enemy); // Помечаем врага как пораженного
                
                if (enemy.isDead) {
                    // Враг умер
                    this.gameManager.addScore(100);
                    this.gameManager.soundManager.playSound('collect');
                }
            }
        });
    }

    /**
     * Обновление игрока
     */
    update(deltaTime) {
        // Обновление состояния смерти
        if (this.isDead) {
            this.deathAnimationTime += deltaTime * 16.67;
            
            // Обновление анимации смерти
            this.currentAnimation = 'dead';
            if (this.sprites && this.sprites[this.currentAnimation]) {
                const animation = this.sprites[this.currentAnimation];
                const frameDuration = animation.frameDuration || 150;
                
                this.frameTimer += deltaTime * 16.67;
                
                if (this.frameTimer >= frameDuration) {
                    this.frameTimer = 0;
                    // Проигрываем анимацию до конца, не зацикливая
                    if (this.currentFrame < animation.frameCount - 1) {
                        this.currentFrame++;
                    }
                }
                
                // Сброс кадра при смене анимации
                if (this.currentAnimation !== this.lastAnimation) {
                    this.currentFrame = 0;
                    this.frameTimer = 0;
                    this.lastAnimation = this.currentAnimation;
                }
            }
            
            if (this.deathAnimationTime >= this.deathAnimationDuration) {
                // Анимация смерти завершена
                this.gameManager.gameOver();
            }
            return; // Не обновляем остальное во время смерти
        }

        // Обновление неуязвимости
        if (this.isInvincible) {
            this.invincibilityTime += deltaTime * 16.67;
            if (this.invincibilityTime >= this.invincibilityDuration) {
                this.isInvincible = false;
                this.invincibilityTime = 0;
            }
        }

        // Обновление атаки
        if (this.isAttacking) {
            this.attackTime += deltaTime * 16.67; // deltaTime в мс
            if (this.attackTime >= this.attackDuration) {
                this.isAttacking = false;
                this.attackTime = 0;
                // Очищаем список пораженных врагов при завершении атаки
                this.hitEnemies.clear();
            }
        }

        // Определяем нижнюю границу уровня
        let levelBottom = this.gameManager.height;
        if (this.gameManager.platforms.length > 0) {
            levelBottom = Math.max(...this.gameManager.platforms.map(p => p.y + p.height), this.gameManager.height);
        }
        
        // Проверка на земле (включая нижнюю границу уровня)
        this.onGround = this.gameManager.physicsManager.isOnGround(
            this, 
            this.gameManager.platforms,
            levelBottom
        );

        // Определение анимации
        if (this.isDead) {
            this.currentAnimation = 'dead';
        } else if (this.isInvincible && this.invincibilityTime % 200 < 100) {
            // Мигание при неуязвимости (показываем hurt анимацию)
            this.currentAnimation = 'hurt';
        } else if (this.isAttacking) {
            // Показываем анимацию атаки персонажа
            this.currentAnimation = `attack${this.attackType}`;
        } else if (!this.onGround) {
            this.currentAnimation = 'jump';
        } else if (Math.abs(this.physics.velocityX) > 0.1) {
            // Используем Run.png для перемещения
            this.currentAnimation = 'run';
        } else {
            // Используем Idle.png для ожидания
            this.currentAnimation = 'idle';
        }

        // Обновление анимации персонажа
        if (this.sprites && this.sprites[this.currentAnimation]) {
            const animation = this.sprites[this.currentAnimation];
            const frameDuration = animation.frameDuration || 150;
            
            this.frameTimer += deltaTime * 16.67; // deltaTime в мс
            
            if (this.frameTimer >= frameDuration) {
                this.frameTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % animation.frameCount;
            }
            
            // Сброс кадра при смене анимации
            if (this.currentAnimation !== this.lastAnimation) {
                this.currentFrame = 0;
                this.frameTimer = 0;
                this.lastAnimation = this.currentAnimation;
            }
        }

        // Обновление анимации эффекта атаки
        if (this.isAttacking && this.attackSprite) {
            this.attackFrameTimer += deltaTime * 16.67;
            const frameDuration = this.attackSprite.frameDuration || 50;
            
            if (this.attackFrameTimer >= frameDuration) {
                this.attackFrameTimer = 0;
                this.attackFrame = (this.attackFrame + 1) % this.attackSprite.frameCount;
            }
        } else {
            // Сброс анимации атаки когда атака закончилась
            this.attackFrame = 0;
            this.attackFrameTimer = 0;
        }

        // Остановка при отсутствии ввода
        if (!this.gameManager.keys['KeyA'] && 
            !this.gameManager.keys['ArrowLeft'] &&
            !this.gameManager.keys['KeyD'] && 
            !this.gameManager.keys['ArrowRight']) {
            this.physics.velocityX *= 0.8; // Трение
        }

        // Проверка тайм-аута комбо
        const now = Date.now();
        if (now - this.lastAttackTime > this.attackComboWindow) {
            this.attackComboCount = 0;
        }
    }

    /**
     * Отрисовка игрока
     */
    render(ctx) {
        if (!this.sprites) {
            // Рендерим заглушку если спрайты еще не загружены
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        const animation = this.sprites[this.currentAnimation];
        if (!animation || !animation.image) {
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        const sprite = animation.image;
        const frameWidth = animation.frameWidth || 64;
        const frameHeight = animation.frameHeight || 64;
        
        // Вычисляем позицию кадра в sprite sheet
        const sourceX = this.currentFrame * frameWidth;
        const sourceY = 0; // Предполагаем горизонтальное расположение кадров

        ctx.save();

        // Эффект мигания при неуязвимости
        if (this.isInvincible && !this.isDead) {
            const alpha = this.invincibilityTime % 200 < 100 ? 0.5 : 1.0;
            ctx.globalAlpha = alpha;
        }

        // Позиция отрисовки с учетом смещения
        const renderX = this.x - this.renderOffsetX;
        const renderY = this.y - this.renderOffsetY;

        // Отражаем спрайт если смотрим влево
        if (this.direction < 0) {
            ctx.translate(renderX + this.renderWidth, renderY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                sprite,
                sourceX, sourceY, frameWidth, frameHeight, // источник
                0, 0, this.renderWidth, this.renderHeight // назначение
            );
        } else {
            ctx.drawImage(
                sprite,
                sourceX, sourceY, frameWidth, frameHeight, // источник
                renderX, renderY, this.renderWidth, this.renderHeight // назначение
            );
        }

        ctx.restore();

        // Отрисовка эффекта атаки поверх персонажа
        if (this.isAttacking && this.attackSprite) {
            const attackImg = this.attackSprite.image;
            const attackFrameWidth = this.attackSprite.frameWidth;
            const attackFrameHeight = this.attackSprite.frameHeight;
            const attackSourceX = this.attackFrame * attackFrameWidth;
            
            // Размеры области атаки
            const attackRange = 80;
            const attackHeight = this.height; // Высота эффекта = высота персонажа
            
            // Позиционируем эффект атаки так, чтобы он заполнял всю область атаки
            const attackOffsetX = this.direction > 0 ? this.width : -attackRange;
            const attackRenderX = this.x + attackOffsetX;
            const attackRenderY = this.y; // Начинаем с позиции персонажа по Y
            
            ctx.save();
            
            // Отражаем эффект если смотрим влево
            if (this.direction < 0) {
                ctx.translate(attackRenderX + attackRange, attackRenderY);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    attackImg,
                    attackSourceX, 0, attackFrameWidth, attackFrameHeight,
                    0, 0, attackRange, attackHeight
                );
            } else {
                ctx.drawImage(
                    attackImg,
                    attackSourceX, 0, attackFrameWidth, attackFrameHeight,
                    attackRenderX, attackRenderY, attackRange, attackHeight
                );
            }
            
            ctx.restore();
        }

    }
}
