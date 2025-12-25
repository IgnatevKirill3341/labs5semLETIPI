import { Entity } from './Entity.js';

/**
 * Класс врага с интеллектуальным поведением
 */
export class Enemy extends Entity {
    constructor(x, y, gameManager, type = 'patrol', characterType = 'Samurai', health = 2) {
        // Физические размеры для коллизий (меньше для лучшей проходимости)
        super(x, y, 40, 50);
        this.gameManager = gameManager;
        this.type = type; // 'patrol', 'chase', 'guard'
        this.characterType = characterType; // Тип персонажа для загрузки спрайтов
        this.maxHealth = health; // Максимальное здоровье
        this.health = health; // Текущее здоровье
        
        // Размеры для отрисовки спрайта (больше, чем хитбокс)
        this.renderWidth = 64;
        this.renderHeight = 64;
        
        // Смещение для центрирования спрайта относительно хитбокса
        this.renderOffsetX = (this.renderWidth - this.width) / 2;
        this.renderOffsetY = (this.renderHeight - this.height) / 2;
        
        this.walkSpeed = 1; // Медленная скорость ходьбы
        this.runSpeed = 3; // Быстрая скорость бега
        this.direction = 1; // 1 - вправо, -1 - влево
        this.patrolDistance = 100;
        this.startX = x;
        this.visionRangeX = 250; // Диапазон обнаружения по оси X
        this.attackRange = 40; // Дистанция атаки (уменьшена)
        this.attackCooldown = 0; // Кулдаун атаки
        this.attackCooldownTime = 1500; // Время между атаками (мс)
        this.isAttacking = false;
        this.attackTime = 0;
        this.attackDuration = 500; // Длительность анимации атаки (мс)
        this.attackWindup = false; // Подготовка к атаке
        this.attackWindupTime = 0;
        this.attackWindupDuration = 300; // Время подготовки к атаке (мс)

        // Спрайты
        this.sprites = null;
        this.attackSprite = null; // Отдельный спрайт для эффекта атаки
        this.currentAnimation = 'idle';
        this.currentFrame = 0; // Текущий кадр анимации
        this.frameTimer = 0; // Таймер для смены кадров
        this.attackFrame = 0; // Кадр анимации атаки
        this.attackFrameTimer = 0; // Таймер для анимации атаки

        // Физика
        this.physics = {
            velocityX: this.walkSpeed * this.direction,
            velocityY: 0,
            gravity: true,
            airResistance: false,
            maxVelocity: 5
        };
        
        // Состояние врага
        this.state = 'patrol'; // 'patrol', 'chase', 'attack'
        
        // Состояние на земле (устанавливается в GameManager)
        this.onGround = false;
        
        // Состояние смерти
        this.isDead = false;
        this.deathAnimationTime = 0;
        this.deathAnimationDuration = 2000; // 2 секунды для анимации смерти

        // Загрузка спрайтов
        this.loadSprites();
        this.lastAnimation = 'idle';
    }

    /**
     * Загрузка спрайтов
     */
    async loadSprites() {
        if (this.gameManager.spriteManager) {
            // Используем characterType для загрузки спрайтов
            // SpriteManager сам формирует путь как assets/${characterType}/...
            this.sprites = await this.gameManager.spriteManager.loadCharacterSprites(this.characterType);
            // Загружаем отдельный спрайт для эффекта атаки
            const attackImg = await this.gameManager.spriteManager.loadSprite('assets/Attacks/Hslash1.png');
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
     * Обновление врага
     */
    update(deltaTime) {
        // Обновление анимации смерти
        if (this.isDead) {
            this.deathAnimationTime += deltaTime * 16.67;
            this.currentAnimation = 'dead';
            this.physics.velocityX = 0;
            this.physics.velocityY = 0;
            this.physics.gravity = false;
            
            // Обновляем анимацию смерти
            if (this.sprites && this.sprites.dead) {
                const animation = this.sprites.dead;
                const frameDuration = animation.frameDuration || 150;
                this.frameTimer += deltaTime * 16.67;
                if (this.frameTimer >= frameDuration) {
                    this.frameTimer = 0;
                    // Для анимации смерти - проигрываем до последнего кадра и останавливаемся
                    if (this.currentFrame < animation.frameCount - 1) {
                        this.currentFrame = this.currentFrame + 1;
                    }
                    // Если достигли последнего кадра, остаемся на нем (не циклируем)
                }
            }
            return; // Не обновляем логику, если враг мертв
        }
        
        if (!this.gameManager.player) return;

        const player = this.gameManager.player;
        
        // Игнорируем игрока во время его смерти
        if (player.isDead) {
            // Во время смерти игрока - просто патрулируем
            // Используем свойство onGround, установленное в GameManager
            const onGround = this.onGround !== undefined ? this.onGround : false;
            this.state = 'patrol';
            this.updatePatrol(onGround);
            this.updateAnimation(onGround);
            return;
        }

        // Проверка на земле
        // Используем свойство onGround, установленное в GameManager, или проверяем через isOnGround
        let onGround = this.onGround !== undefined ? this.onGround : false;
        if (onGround === undefined || onGround === false) {
            // Если onGround не установлен, проверяем через isOnGround
            let levelBottom = this.gameManager.height;
            if (this.gameManager.platforms.length > 0) {
                levelBottom = Math.max(...this.gameManager.platforms.map(p => p.y + p.height), this.gameManager.height);
            }
            onGround = this.gameManager.physicsManager.isOnGround(
                this,
                this.gameManager.platforms,
                levelBottom
            );
        }
        
        // КРИТИЧНО: Если враг не на земле, останавливаем горизонтальное движение
        if (!onGround) {
            this.physics.velocityX = 0;
        }

        // Обновление подготовки к атаке
        if (this.attackWindup) {
            this.attackWindupTime += deltaTime * 16.67;
            this.physics.velocityX = 0; // Останавливаемся во время подготовки
            if (this.attackWindupTime >= this.attackWindupDuration) {
                // Подготовка завершена - начинаем атаку
                this.attackWindup = false;
                this.attackWindupTime = 0;
                this.isAttacking = true;
                this.attackTime = 0;
            }
        }

        // Обновление атаки
        if (this.isAttacking) {
            this.attackTime += deltaTime * 16.67;
            if (this.attackTime >= this.attackDuration) {
                this.isAttacking = false;
                this.attackTime = 0;
                this.attackCooldown = this.attackCooldownTime;
            }
        }

        // Обновление кулдауна атаки
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime * 16.67;
        }

        // Проверка расстояния до игрока по оси X
        const distanceX = Math.abs(player.x - this.x);
        const distanceY = Math.abs(player.y - this.y);
        
        // Проверяем, находится ли игрок на том же уровне (по Y)
        // Игрок считается на том же уровне, если разница по Y не более 100 пикселей
        const sameLevelY = distanceY < 100;
        
        // Проверка луча зрения - может ли враг видеть игрока (нет препятствий/платформ между ними)
        const canSeePlayer = this.checkLineOfSight(player);
        
        // Определение состояния (только если не в процессе атаки или подготовки)
        // Враги могут видеть игрока даже в воздухе, но двигаться только на земле
        if (!this.attackWindup && !this.isAttacking && canSeePlayer) {
            if (distanceX <= this.attackRange && sameLevelY && this.attackCooldown <= 0 && onGround) {
                // Игрок в зоне атаки и на том же уровне - начинаем подготовку к атаке (только на земле)
                this.state = 'attack';
                this.attackWindup = true;
                this.attackWindupTime = 0;
                this.physics.velocityX = 0;
                // Поворачиваемся к игроку
                this.direction = player.x > this.x ? 1 : -1;
            } else if (distanceX <= this.visionRangeX && sameLevelY) {
                // Игрок в поле зрения и на том же уровне - преследуем
                this.state = 'chase';
                // Двигаемся только если на земле
                if (onGround) {
                    this.updateChase(player, distanceX);
                } else {
                    // В воздухе - просто поворачиваемся к игроку, но не двигаемся
                    this.direction = player.x > this.x ? 1 : -1;
                    this.physics.velocityX = 0;
                }
            } else {
                // Игрок не в поле зрения или на другом уровне - патрулируем
                this.state = 'patrol';
                // Двигаемся только если на земле
                if (onGround) {
                    this.updatePatrol(onGround);
                } else {
                    // В воздухе - не двигаемся горизонтально
                    this.physics.velocityX = 0;
                }
            }
        }
        
        // Выполняем атаку, если она началась
        if (this.isAttacking && !this.attackWindup) {
            this.attackPlayer(player);
        }

        // Определение анимации
        this.updateAnimation(onGround);

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
    }

    /**
     * Патрулирование (медленная ходьба)
     */
    updatePatrol(onGround) {
        // Движение только на земле
        if (!onGround) {
            this.physics.velocityX = 0;
            return;
        }
        
        // Проверка границ уровня - разворачиваемся до достижения границы
        if (this.gameManager.levelWidth > 0) {
            const margin = 10; // Отступ от границы
            if (this.x <= margin && this.direction < 0) {
                // Приближаемся к левой границе, движемся влево - разворачиваемся
                this.direction = 1;
                this.startX = Math.max(this.startX, margin);
            } else if (this.x + this.width >= this.gameManager.levelWidth - margin && this.direction > 0) {
                // Приближаемся к правой границе, движемся вправо - разворачиваемся
                this.direction = -1;
                this.startX = Math.min(this.startX, this.gameManager.levelWidth - this.width - margin);
            }
        }
        
        // Проверка на обрыв или шипы перед врагом
        if (this.checkCliffOrSpike()) {
            this.direction *= -1;
        }
        
        // Движение туда-сюда медленно
        if (Math.abs(this.x - this.startX) > this.patrolDistance) {
            this.direction *= -1;
        }
        this.physics.velocityX = this.walkSpeed * this.direction;
    }

    /**
     * Преследование игрока (быстрый бег)
     */
    updateChase(player, distanceX) {
        // Движение к игроку быстро (только на земле)
        // Проверка onGround уже выполнена в update()
        
        // Проверка границ уровня - не преследуем за границами
        if (this.gameManager.levelWidth > 0) {
            const margin = 10; // Отступ от границы
            if (this.x <= margin && player.x < this.x) {
                // Игрок за левой границей, враг у левой границы - не преследуем
                this.physics.velocityX = 0;
                return;
            } else if (this.x + this.width >= this.gameManager.levelWidth - margin && player.x > this.x) {
                // Игрок за правой границей, враг у правой границы - не преследуем
                this.physics.velocityX = 0;
                return;
            }
        }
        
        if (player.x > this.x) {
            this.direction = 1;
        } else {
            this.direction = -1;
        }
        
        // Проверка на шипы между врагом и игроком
        if (this.hasSpikesBetween(player)) {
            // Если между врагом и игроком есть шипы, не преследуем
            this.physics.velocityX = 0;
            return;
        }
        
        // Проверка на обрыв или шипы перед врагом
        if (this.checkCliffOrSpike()) {
            // Если впереди обрыв или шипы, останавливаемся (не преследуем)
            this.physics.velocityX = 0;
        } else {
            this.physics.velocityX = this.runSpeed * this.direction;
        }
    }

    /**
     * Проверка на обрыв платформы или шипы перед врагом
     * @returns {boolean} - true если впереди обрыв или шипы
     */
    checkCliffOrSpike() {
        // Проверяем точку перед врагом (немного впереди и на 5 пикселей ниже ног)
        const checkDistance = 20; // Расстояние проверки впереди
        const checkX = this.x + (this.direction > 0 ? this.width + checkDistance : -checkDistance);
        const checkY = this.y + this.height + 5; // На 5 пикселей ниже ног врага
        
        // Используем ту же логику, что и isOnGround - проверяем, есть ли платформа под точкой
        // Создаем тестовый прямоугольник под точкой проверки
        const testRect = {
            x: checkX - 5, // Небольшая ширина для проверки (10 пикселей)
            y: checkY,
            width: 10,
            height: 1
        };
        
        // Проверяем, есть ли платформа под точкой проверки
        let hasPlatform = false;
        for (const platform of this.gameManager.platforms) {
            const platformRect = {
                x: platform.x,
                y: platform.y,
                width: platform.width,
                height: platform.height
            };
            
            // Проверяем коллизию тестового прямоугольника с платформой
            // Это означает, что платформа находится под точкой проверки
            if (this.gameManager.physicsManager.checkCollision(testRect, platformRect)) {
                hasPlatform = true;
                break;
            }
        }
        
        // Если нет платформы - это обрыв
        if (!hasPlatform) {
            return true;
        }
        
        // Проверяем, есть ли шип перед врагом
        if (this.gameManager.spikes && this.gameManager.spikes.length > 0) {
            for (const spike of this.gameManager.spikes) {
                // Проверяем, находится ли шип перед врагом в направлении движения
                const spikeCenterX = spike.x + spike.width / 2;
                const enemyCenterX = this.x + this.width / 2;
                
                // Шип должен быть впереди врага в направлении движения
                const isAhead = (this.direction > 0 && spikeCenterX > enemyCenterX) ||
                                (this.direction < 0 && spikeCenterX < enemyCenterX);
                
                if (isAhead) {
                    // Проверяем, находится ли шип на той же платформе (примерно на том же уровне Y)
                    const spikeTop = spike.y;
                    const enemyBottom = this.y + this.height;
                    const levelDifference = Math.abs(spikeTop - enemyBottom);
                    
                    // Если шип на том же уровне (в пределах 10 пикселей) и впереди
                    if (levelDifference <= 10) {
                        // Проверяем горизонтальное расстояние
                        const horizontalDistance = Math.abs(spikeCenterX - enemyCenterX);
                        if (horizontalDistance <= this.width + 20) { // В пределах ширины врага + небольшой запас
                            return true; // Шип впереди, нужно развернуться
                        }
                    }
                }
            }
        }
        
        return false; // Нет обрыва и шипов
    }

    /**
     * Проверка, есть ли шипы между врагом и игроком
     * @param {Object} player - Объект игрока
     * @returns {boolean} - true если между врагом и игроком есть шипы
     */
    hasSpikesBetween(player) {
        if (!this.gameManager.spikes || this.gameManager.spikes.length === 0) {
            return false;
        }

        const enemyCenterX = this.x + this.width / 2;
        const playerCenterX = player.x + player.width / 2;
        const enemyBottom = this.y + this.height;
        
        // Определяем диапазон между врагом и игроком
        const minX = Math.min(enemyCenterX, playerCenterX);
        const maxX = Math.max(enemyCenterX, playerCenterX);
        
        // Проверяем каждый шип
        for (const spike of this.gameManager.spikes) {
            const spikeLeft = spike.x;
            const spikeRight = spike.x + spike.width;
            const spikeCenterX = spike.x + spike.width / 2;
            const spikeTop = spike.y;
            
            // Проверяем, находится ли шип между врагом и игроком по горизонтали
            const isBetweenX = spikeCenterX >= minX && spikeCenterX <= maxX;
            
            if (isBetweenX) {
                // Проверяем, находится ли шип на том же уровне, что и враг (на платформе)
                const levelDifference = Math.abs(spikeTop - enemyBottom);
                
                // Если шип на том же уровне (в пределах 15 пикселей) и между врагом и игроком
                if (levelDifference <= 15) {
                    // Проверяем, что шип действительно блокирует путь (не слишком далеко)
                    const distanceToSpike = Math.abs(spikeCenterX - enemyCenterX);
                    if (distanceToSpike <= this.width + 50) { // В пределах разумного расстояния
                        return true; // Шип блокирует путь к игроку
                    }
                }
            }
        }
        
        return false; // Нет шипов между врагом и игроком
    }

    /**
     * Проверка луча зрения - может ли враг видеть игрока
     * @param {Object} player - Объект игрока
     * @returns {boolean} - true если враг может видеть игрока
     */
    checkLineOfSight(player) {
        // Проверяем, нет ли препятствий или платформ между врагом и игроком
        const enemyCenterX = this.x + this.width / 2;
        const enemyCenterY = this.y + this.height / 2;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        // Проверяем препятствия
        for (const obstacle of this.gameManager.obstacles) {
            if (this.lineIntersectsRect(
                enemyCenterX, enemyCenterY,
                playerCenterX, playerCenterY,
                obstacle.x, obstacle.y, obstacle.width, obstacle.height
            )) {
                return false; // Препятствие блокирует обзор
            }
        }
        
        // Проверяем платформы (только если они между врагом и игроком по Y)
        const minY = Math.min(enemyCenterY, playerCenterY);
        const maxY = Math.max(enemyCenterY, playerCenterY);
        
        for (const platform of this.gameManager.platforms) {
            const platformCenterY = platform.y + platform.height / 2;
            // Платформа между врагом и игроком по Y
            if (platformCenterY > minY && platformCenterY < maxY) {
                if (this.lineIntersectsRect(
                    enemyCenterX, enemyCenterY,
                    playerCenterX, playerCenterY,
                    platform.x, platform.y, platform.width, platform.height
                )) {
                    return false; // Платформа блокирует обзор
                }
            }
        }
        
        return true; // Нет препятствий
    }
    
    /**
     * Проверка пересечения линии с прямоугольником
     */
    lineIntersectsRect(x1, y1, x2, y2, rectX, rectY, rectW, rectH) {
        // Упрощенная проверка: проверяем пересечение линии с границами прямоугольника
        const dx = x2 - x1;
        const dy = y2 - y1;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        
        if (steps === 0) return false;
        
        const stepX = dx / steps;
        const stepY = dy / steps;
        
        for (let i = 0; i <= steps; i++) {
            const x = x1 + stepX * i;
            const y = y1 + stepY * i;
            
            if (x >= rectX && x <= rectX + rectW && y >= rectY && y <= rectY + rectH) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Получение урона
     */
    takeDamage(amount = 1) {
        if (this.isDead) return;
        
        this.health -= amount;
        if (this.health <= 0) {
            this.isDead = true;
            this.deathAnimationTime = 0;
            this.currentAnimation = 'dead';
            this.currentFrame = 0; // Начинаем анимацию смерти с первого кадра
            this.frameTimer = 0; // Сбрасываем таймер
            this.lastAnimation = 'dead'; // Обновляем последнюю анимацию
            this.physics.velocityX = 0;
            this.physics.velocityY = 0;
            this.physics.gravity = false;
            // Воспроизводим звук смерти врага
            if (this.gameManager && this.gameManager.soundManager) {
                this.gameManager.soundManager.playSound('death');
            }
        }
    }

    /**
     * Атака игрока
     */
    attackPlayer(player) {
        // Проверка попадания атаки
        const attackBox = {
            x: this.x + (this.direction > 0 ? this.width : -this.attackRange),
            y: this.y,
            width: this.attackRange,
            height: this.height
        };

        if (this.gameManager.physicsManager.checkCollision(attackBox, player)) {
            // Наносим урон игроку
            if (!player.isInvincible && !player.isDead) {
                this.gameManager.hitObstacle(this);
            }
        }
    }

    /**
     * Обновление анимации
     */
    updateAnimation(onGround) {
        // Если враг мертв, показываем анимацию смерти (но не возвращаемся, чтобы анимация обновлялась)
        if (this.isDead) {
            this.currentAnimation = 'dead';
            // Не возвращаемся - анимация будет обновляться в update()
        }
        
        // Показываем анимацию атаки во время подготовки и самой атаки
        if (this.attackWindup || this.isAttacking) {
            this.currentAnimation = 'attack1';
        } else if (!onGround) {
            this.currentAnimation = 'jump';
        } else if (this.state === 'chase') {
            this.currentAnimation = 'run';
        } else if (this.state === 'patrol' && Math.abs(this.physics.velocityX) > 0.1) {
            this.currentAnimation = 'walk';
        } else {
            this.currentAnimation = 'idle';
        }
    }

    /**
     * Отрисовка врага
     */
    render(ctx) {
        if (!this.sprites) {
            // Рендерим заглушку если спрайты еще не загружены
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        const animation = this.sprites[this.currentAnimation];
        if (!animation || !animation.image) {
            ctx.fillStyle = '#FF0000';
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

        // Отрисовка эффекта атаки поверх врага (только если враг не мертв)
        if (!this.isDead && this.isAttacking && this.attackSprite) {
            const attackImg = this.attackSprite.image;
            const attackFrameWidth = this.attackSprite.frameWidth;
            const attackFrameHeight = this.attackSprite.frameHeight;
            const attackSourceX = this.attackFrame * attackFrameWidth;
            
            // Размеры области атаки
            const attackRange = this.attackRange || 40;
            const attackHeight = this.height; // Высота эффекта = высота врага
            
            // Позиционируем эффект атаки так, чтобы он заполнял всю область атаки
            const attackOffsetX = this.direction > 0 ? this.width : -attackRange;
            const attackRenderX = this.x + attackOffsetX;
            const attackRenderY = this.y; // Начинаем с позиции врага по Y
            
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
