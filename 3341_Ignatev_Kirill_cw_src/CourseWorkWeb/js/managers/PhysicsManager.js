/**
 * Менеджер физики объектов
 * Управляет физикой движения, коллизиями и взаимодействием объектов
 */
export class PhysicsManager {
    constructor() {
        this.gravity = 0.6; // Уменьшена гравитация для более высокого прыжка
        this.friction = 0.9;
        this.airResistance = 0.98;
    }

    /**
     * Обновление физики объекта
     * @param {Object} entity - Объект с физическими свойствами
     * @param {number} deltaTime - Время с последнего кадра
     */
    update(entity, deltaTime = 1) {
        if (!entity.physics) return;

        const physics = entity.physics;

        // Применение гравитации
        if (physics.gravity) {
            physics.velocityY += this.gravity * deltaTime;
        }

        // Применение сопротивления воздуха
        if (physics.airResistance) {
            physics.velocityX *= this.airResistance;
            physics.velocityY *= this.airResistance;
        }

        // Обновление позиции
        entity.x += physics.velocityX * deltaTime;
        entity.y += physics.velocityY * deltaTime;

        // Ограничение максимальной скорости
        if (physics.maxVelocity) {
            physics.velocityX = Math.max(-physics.maxVelocity, Math.min(physics.maxVelocity, physics.velocityX));
            physics.velocityY = Math.max(-physics.maxVelocity, Math.min(physics.maxVelocity, physics.velocityY));
        }
    }

    /**
     * Проверка коллизии между двумя прямоугольниками
     * @param {Object} rect1 - Первый прямоугольник {x, y, width, height}
     * @param {Object} rect2 - Второй прямоугольник {x, y, width, height}
     * @returns {boolean} - true если есть коллизия
     */
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * Проверка коллизии с учетом смещения
     * @param {Object} entity - Объект
     * @param {Object} target - Целевой объект
     * @param {number} offsetX - Смещение по X
     * @param {number} offsetY - Смещение по Y
     * @returns {boolean} - true если есть коллизия
     */
    checkCollisionWithOffset(entity, target, offsetX = 0, offsetY = 0) {
        const rect1 = {
            x: entity.x + offsetX,
            y: entity.y + offsetY,
            width: entity.width,
            height: entity.height
        };
        const rect2 = {
            x: target.x,
            y: target.y,
            width: target.width,
            height: target.height
        };
        return this.checkCollision(rect1, rect2);
    }

    /**
     * Обработка коллизии с границами
     * @param {Object} entity - Объект
     * @param {number} worldWidth - Ширина мира
     * @param {number} worldHeight - Высота мира
     * @param {boolean} bounce - Отскакивать от границ
     */
    handleBoundaryCollision(entity, worldWidth, worldHeight, bounce = false) {
        if (entity.x < 0) {
            entity.x = 0;
            if (bounce && entity.physics) {
                entity.physics.velocityX *= -0.5;
            } else if (entity.physics) {
                entity.physics.velocityX = 0;
            }
        }
        if (entity.x + entity.width > worldWidth) {
            entity.x = worldWidth - entity.width;
            if (bounce && entity.physics) {
                entity.physics.velocityX *= -0.5;
            } else if (entity.physics) {
                entity.physics.velocityX = 0;
            }
        }
        if (entity.y < 0) {
            entity.y = 0;
            if (bounce && entity.physics) {
                entity.physics.velocityY *= -0.5;
            } else if (entity.physics) {
                entity.physics.velocityY = 0;
            }
        }
        if (entity.y + entity.height > worldHeight) {
            entity.y = worldHeight - entity.height;
            if (bounce && entity.physics) {
                entity.physics.velocityY *= -0.5;
            } else if (entity.physics) {
                entity.physics.velocityY = 0;
            }
        }
    }

    /**
     * Применение силы к объекту
     * @param {Object} entity - Объект
     * @param {number} forceX - Сила по X
     * @param {number} forceY - Сила по Y
     */
    applyForce(entity, forceX, forceY) {
        if (!entity.physics) return;
        entity.physics.velocityX += forceX;
        entity.physics.velocityY += forceY;
    }

    /**
     * Установка скорости объекта
     * @param {Object} entity - Объект
     * @param {number} velocityX - Скорость по X
     * @param {number} velocityY - Скорость по Y
     */
    setVelocity(entity, velocityX, velocityY) {
        if (!entity.physics) return;
        entity.physics.velocityX = velocityX;
        entity.physics.velocityY = velocityY;
    }

    /**
     * Проверка, находится ли объект на земле
     * @param {Object} entity - Объект
     * @param {Array} platforms - Массив платформ
     * @param {number} worldHeight - Высота мира (опционально)
     * @returns {boolean} - true если на земле
     */
    isOnGround(entity, platforms, worldHeight = null) {
        const testY = entity.y + entity.height + 1;
        const testRect = {
            x: entity.x,
            y: testY,
            width: entity.width,
            height: 1
        };

        // Проверка на платформах
        const onPlatform = platforms.some(platform => {
            const platformRect = {
                x: platform.x,
                y: platform.y,
                width: platform.width,
                height: platform.height
            };
            return this.checkCollision(testRect, platformRect);
        });

        // Проверка на нижней границе мира (если указана)
        if (worldHeight !== null && !onPlatform) {
            if (entity.y + entity.height >= worldHeight - 1) {
                return true;
            }
        }

        return onPlatform;
    }
}
