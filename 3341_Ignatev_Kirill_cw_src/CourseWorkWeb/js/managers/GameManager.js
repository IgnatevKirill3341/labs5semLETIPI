import { EventManager } from './EventManager.js';
import { SoundManager } from './SoundManager.js';
import { PhysicsManager } from './PhysicsManager.js';
import { SpriteManager } from './SpriteManager.js';
import { LevelManager } from '../levels/LevelManager.js';
import { Player } from '../entities/Player.js';
import { ScoreManager } from './ScoreManager.js';

/**
 * Менеджер игры
 * Главный менеджер, координирующий все системы игры
 */
export class GameManager {
    constructor(canvas) {
        try {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.width = canvas.width;
            this.height = canvas.height;

            // Инициализация менеджеров
            console.log('Создание менеджеров...');
            this.eventManager = new EventManager();
            this.soundManager = new SoundManager();
            this.physicsManager = new PhysicsManager();
            this.spriteManager = new SpriteManager();
            this.levelManager = new LevelManager(this);
            this.scoreManager = new ScoreManager();
            console.log('Менеджеры созданы');

            // Состояние игры
            this.state = 'menu'; // menu, playing, paused, gameover, victory
            this.currentLevel = 1;
            this.score = 0;
            this.lives = 5;

            // Игровые объекты
            this.player = null;
            this.entities = [];
            this.platforms = [];
            this.obstacles = [];
            this.enemies = [];
            this.bonuses = [];
            this.spikes = []; // Шипы
            this.gates = [];
            this.levelWidth = 0; // Ширина уровня
            
            // Данные уровня для визуального рендеринга
            this.currentLevelData = null;
            this.tilesetImages = new Map(); // Кеш изображений tilesets
            this.backgroundImage = null; // Фоновое изображение для повторяющегося фона

            // Игровой цикл
            this.lastTime = performance.now();
            this.animationFrame = null;

            // Камера
            this.camera = {
                x: 0,
                y: 0,
                scale: 2.0, // Увеличенный масштаб
                followSpeed: 0.1 // Плавность следования камеры
            };

            // Управление
            this.keys = {};
            this.mouseButtons = {};
            this.setupControls();
            this.setupMouseControls();
            console.log('GameManager создан успешно');
        } catch (error) {
            console.error('Ошибка в конструкторе GameManager:', error);
            throw error;
        }
    }

    /**
     * Инициализация игры
     */
    init() {
        try {
            console.log('Начало инициализации...');
            this.setupUI();
            console.log('UI настроен, показ меню...');
            this.showMenu(); // Используем showMenu() для воспроизведения фоновой музыки
            console.log('Загрузка рекордов...');
            this.loadScores();
            console.log('Инициализация завершена успешно');
        } catch (error) {
            console.error('Ошибка в init():', error);
            console.error('Стек ошибки:', error.stack);
            throw error;
        }
    }

    /**
     * Настройка управления
     */
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (this.state === 'playing') {
                this.handleInput();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    /**
     * Настройка управления мышью
     */
    setupMouseControls() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.state === 'playing' && this.player && e.button === 0) { // ЛКМ
                e.preventDefault();
                this.player.attack();
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseButtons['left'] = false;
            }
        });
    }

    /**
     * Обработка ввода
     */
    handleInput() {
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.player.moveLeft();
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.player.moveRight();
        }
        if (this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.player.jump();
        }
    }

    /**
     * Настройка UI
     */
    setupUI() {
        console.log('Настройка UI...');
        
        // Используем делегирование событий для надежности
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            console.error('game-container не найден!');
            return;
        }

        // Обработчик для всех кнопок через делегирование
        gameContainer.addEventListener('click', (e) => {
            const target = e.target;
            if (!target || target.tagName !== 'BUTTON') return;

            const buttonId = target.id;
            console.log('Нажата кнопка:', buttonId);

            e.preventDefault();
            e.stopPropagation();

            switch (buttonId) {
                case 'start-btn':
                    console.log('Запуск игры...');
                    this.startGame().catch(error => {
                        console.error('Ошибка при запуске игры:', error);
                        alert('Ошибка при загрузке игры. Проверьте консоль для деталей.');
                    });
                    break;
                case 'scores-btn':
                    console.log('Показ рекордов...');
                    this.showScores();
                    break;
                case 'settings-btn':
                    console.log('Показ настроек...');
                    this.showSettings();
                    break;
                case 'back-from-scores-btn':
                case 'back-from-settings-btn':
                    console.log('Возврат в меню...');
                    this.showMenu();
                    break;
                case 'toggle-sound-btn':
                    console.log('Переключение звука...');
                    this.toggleSound();
                    break;
                case 'restart-btn':
                    console.log('Перезапуск игры...');
                    this.startGame().catch(error => {
                        console.error('Ошибка при перезапуске игры:', error);
                        alert('Ошибка при загрузке игры. Проверьте консоль для деталей.');
                    });
                    break;
                case 'menu-btn':
                    console.log('Возврат в главное меню...');
                    this.showMenu();
                    break;
                case 'save-score-btn':
                    console.log('Сохранение результата...');
                    this.saveScore();
                    break;
                case 'victory-save-score-btn':
                    console.log('Сохранение результата (победа)...');
                    this.saveVictoryScore();
                    break;
                case 'victory-restart-btn':
                    console.log('Перезапуск игры (победа)...');
                    this.startGame().catch(error => {
                        console.error('Ошибка при перезапуске игры:', error);
                        alert('Ошибка при загрузке игры. Проверьте консоль для деталей.');
                    });
                    break;
                case 'victory-menu-btn':
                    console.log('Возврат в главное меню (победа)...');
                    this.showMenu();
                    break;
                default:
                    console.log('Неизвестная кнопка:', buttonId);
            }
        });

        // Также добавляем прямые обработчики для совместимости
        const startBtn = document.getElementById('start-btn');
        const scoresBtn = document.getElementById('scores-btn');
        const settingsBtn = document.getElementById('settings-btn');

        console.log('Найдены кнопки:', {
            startBtn: !!startBtn,
            scoresBtn: !!scoresBtn,
            settingsBtn: !!settingsBtn
        });

        if (!startBtn) console.error('Кнопка start-btn не найдена!');
        if (!scoresBtn) console.error('Кнопка scores-btn не найдена!');
        if (!settingsBtn) console.error('Кнопка settings-btn не найдена!');
        
        console.log('UI настроен');
    }

    /**
     * Начать игру
     */
    async startGame() {
        console.log('Запуск игры...');
        this.state = 'playing';
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 5;
        this.showScreen('game-screen');
        
        // Останавливаем фоновую музыку главного меню
        if (this.soundManager) {
            this.soundManager.stopMusic();
            // Воспроизводим музыку игрового процесса
            this.soundManager.playMusic('gameprocess');
        }
        
        // Загружаем уровень и ждём загрузки тайлов
        await this.loadLevel(this.currentLevel);
        
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    /**
     * Загрузить уровень
     */
    async loadLevel(levelNumber) {
        const level = this.levelManager.loadLevel(levelNumber);
        if (!level) {
            this.gameOver();
            return;
        }

        // Очистка предыдущих объектов
        this.entities = [];
        this.platforms = [];
        this.obstacles = [];
        this.enemies = [];
        this.bonuses = [];
        this.spikes = [];
        this.gates = [];

        // Сохраняем данные уровня для визуального рендеринга
        this.currentLevelData = level;

        // Загружаем tileset изображения ОБЯЗАТЕЛЬНО перед продолжением
        if (!level.tilesets || level.tilesets.length === 0) {
            throw new Error('Уровень не содержит tilesets! Тайлы обязательны для работы игры.');
        }
        
        await this.loadTilesets(level.tilesets);
        
        // Проверяем, что хотя бы один tileset загружен
        if (this.tilesetImages.size === 0) {
            throw new Error('Не удалось загрузить ни один tileset!');
        }

        // Загружаем фоновое изображение, если оно указано
        if (level.backgroundImage && level.backgroundImage.image) {
            // Преобразуем путь из Tiled формата (../assets/...) в правильный путь
            let imagePath = level.backgroundImage.image;
            // Убираем ../ если есть в начале
            imagePath = imagePath.replace(/^\.\.\//, '');
            // Путь уже должен быть assets/MapAssets/Full_bgx32.png
            this.backgroundImage = await this.spriteManager.loadSprite(imagePath);
            if (!this.backgroundImage) {
                console.warn('Не удалось загрузить фоновое изображение:', imagePath);
            } else {
                console.log('Фоновое изображение загружено:', imagePath);
            }
        }

        // Создание игрока
        this.player = new Player(level.playerStartX, level.playerStartY, this);

        // Загрузка платформ и объектов из уровня
        this.platforms = level.platforms || [];
        this.obstacles = level.obstacles || [];
        this.enemies = level.enemies || [];
        this.bonuses = level.bonuses || [];
        this.spikes = level.spikes || [];
        this.gates = level.gates || [];
        this.levelWidth = level.width || 2000;

        // Сбрасываем состояние всех врагов (на случай перезапуска игры)
        this.enemies.forEach(enemy => {
            // Сбрасываем состояние смерти
            enemy.isDead = false;
            enemy.health = 2; // Полное здоровье
            enemy.deathAnimationTime = 0;
            enemy.currentAnimation = 'idle';
            enemy.currentFrame = 0;
            enemy.frameTimer = 0;
            enemy.lastAnimation = 'idle';
            
            // Сбрасываем состояние атаки
            enemy.isAttacking = false;
            enemy.attackTime = 0;
            enemy.attackWindup = false;
            enemy.attackWindupTime = 0;
            enemy.attackCooldown = 0;
            enemy.state = 'patrol';
            
            // Сбрасываем физику
            enemy.physics.velocityX = enemy.walkSpeed * enemy.direction;
            enemy.physics.velocityY = 0;
            enemy.physics.gravity = true;
            enemy.onGround = false;
            
            // Сбрасываем позицию патрулирования
            enemy.startX = enemy.x;
            enemy.direction = 1;
        });

        // Сбрасываем состояние всех врат (на случай перезапуска игры)
        this.gates.forEach(gate => {
            gate.isOpen = false; // Ворота должны быть закрыты при начале уровня
        });

        // Принудительно размещаем врагов на платформах
        this.enemies.forEach(enemy => {
            const oldY = enemy.y;
            const oldX = enemy.x;
            this.placeEnemyOnPlatform(enemy);
            // console.log(`Враг размещен: было X=${oldX}, Y=${oldY}, стало X=${enemy.x}, Y=${enemy.y}, на платформе: ${enemy.y + enemy.height}`);
            // Убеждаемся, что velocityY обнулен
            if (enemy.physics) {
                enemy.physics.velocityY = 0;
            }
        });

        // Обновление UI
        this.updateUI();
        this.soundManager.playSound('levelup');
    }

    /**
     * Игровой цикл
     */
    gameLoop(currentTime) {
        if (this.state !== 'playing') return;

        if (!currentTime) {
            currentTime = performance.now();
        }

        const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2); // Ограничение deltaTime
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationFrame = requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * Обновление игры
     */
    update(deltaTime) {
        // Обновление игрока
        if (this.player) {
            this.player.update(deltaTime);
            this.player.checkAttackHit(); // Проверка попаданий атаки
            this.physicsManager.update(this.player, deltaTime);
            // Не ограничиваем границами экрана - уровень больше экрана
            // this.physicsManager.handleBoundaryCollision(this.player, this.width, this.height);
            
            // Обновление камеры - следует за игроком
            this.updateCamera();
        }

        // Обновление врагов
        this.enemies.forEach(enemy => {
            // Сначала вызываем update врага (включая анимацию смерти для мертвых)
            enemy.update(deltaTime);
            
            // Пропускаем физику и логику для мертвых врагов
            if (enemy.isDead) {
                return;
            }
            
            // Применяем физику только для живых врагов
            this.physicsManager.update(enemy, deltaTime);
            
            // Ограничение границами уровня для врагов
            if (this.levelWidth > 0) {
                // Левая граница
                if (enemy.x < 0) {
                    enemy.x = 0;
                    enemy.direction = 1; // Разворачиваем вправо
                    enemy.startX = Math.max(enemy.startX, 10); // Обновляем стартовую позицию, чтобы не застревать
                    if (enemy.physics) {
                        enemy.physics.velocityX = 0;
                    }
                }
                // Правая граница
                if (enemy.x + enemy.width > this.levelWidth) {
                    enemy.x = this.levelWidth - enemy.width;
                    enemy.direction = -1; // Разворачиваем влево
                    enemy.startX = Math.min(enemy.startX, this.levelWidth - enemy.width - 10); // Обновляем стартовую позицию
                    if (enemy.physics) {
                        enemy.physics.velocityX = 0;
                    }
                }
            }
            
            // ПОСЛЕ ФИЗИКИ: находим ближайшую платформу под врагом и размещаем его на ней
            let enemyOnPlatform = false;
            const enemyBottom = enemy.y + enemy.height;
            const enemyTop = enemy.y;
            const enemyLeft = enemy.x;
            const enemyRight = enemy.x + enemy.width;
            const enemyCenterX = enemy.x + enemy.width / 2;
            
            // Ищем ближайшую платформу под врагом
            let closestPlatform = null;
            let minDistance = Infinity;
            
            for (let i = 0; i < this.platforms.length; i++) {
                const platform = this.platforms[i];
                const platformLeft = platform.x;
                const platformRight = platform.x + platform.width;
                const platformTop = platform.y;
                const platformCenterX = platform.x + platform.width / 2;
                
                // Проверяем пересечение по X (враг должен быть хотя бы частично над платформой)
                const overlapsX = enemyRight > platformLeft && enemyLeft < platformRight;
                
                // Также проверяем близость по X (в пределах 500 пикселей)
                const closeX = Math.abs(enemyCenterX - platformCenterX) < (platform.width / 2 + enemy.width / 2 + 500);
                
                if (overlapsX || closeX) {
                    // Враг над платформой по X - вычисляем расстояние по Y
                    const distanceY = Math.abs(enemyBottom - platformTop);
                    
                    // Если враг находится над платформой (в пределах 200 пикселей по Y)
                    if (enemyBottom <= platformTop + 200 && enemyTop <= platformTop + 200) {
                        if (distanceY < minDistance) {
                            minDistance = distanceY;
                            closestPlatform = platform;
                        }
                    }
                }
            }
            
            // Если нашли платформу, размещаем врага на ней
            if (closestPlatform) {
                enemy.y = closestPlatform.y - enemy.height;
                if (enemy.physics) {
                    enemy.physics.velocityY = 0;
                    enemy.physics.gravity = false; // Отключаем гравитацию
                }
                enemy.onGround = true;
                enemyOnPlatform = true;
            }
            
            if (!enemyOnPlatform) {
                // Враг не на платформе - проверяем, на земле ли он
                enemy.onGround = this.physicsManager.isOnGround(
                    enemy,
                    this.platforms,
                    this.height
                );
                
                // Если враг не на земле, включаем гравитацию, чтобы он упал
                if (enemy.physics && !enemy.onGround) {
                    enemy.physics.gravity = true;
                } else if (enemy.physics && enemy.onGround) {
                    // Враг на земле (нижняя граница уровня) - отключаем гравитацию
                    enemy.physics.gravity = false;
                    enemy.physics.velocityY = 0;
                }
            }
            
            // Обработка коллизий врагов с платформами (только боковые коллизии, вертикальные уже обработаны)
            if (enemyOnPlatform) {
                // Враг уже на платформе - обрабатываем только боковые коллизии
                this.platforms.forEach(platform => {
                    if (this.physicsManager.checkCollision(enemy, platform)) {
                        const enemyRight = enemy.x + enemy.width;
                        const enemyLeft = enemy.x;
                        const platformRight = platform.x + platform.width;
                        const platformLeft = platform.x;
                        
                        // Только боковые коллизии
                        if (enemyLeft < platformLeft && enemyRight > platformLeft) {
                            enemy.x = platformLeft - enemy.width;
                            if (enemy.physics) {
                                enemy.physics.velocityX = 0;
                            }
                        } else if (enemyRight > platformRight && enemyLeft < platformRight) {
                            enemy.x = platformRight;
                            if (enemy.physics) {
                                enemy.physics.velocityX = 0;
                            }
                        }
                    }
                });
            }
            
            // Враги могут двигаться по всему уровню, ограничиваем только по Y снизу
            if (enemy.y + enemy.height > this.height) {
                enemy.y = this.height - enemy.height;
                if (enemy.physics) {
                    enemy.physics.velocityY = 0;
                    enemy.physics.gravity = false;
                }
                enemy.onGround = true;
            }
        });

        // Обновление бонусов
        this.bonuses.forEach(bonus => {
            bonus.update(deltaTime);
        });

        // Обновление врат
        this.gates.forEach(gate => {
            gate.checkOpen();
        });

        // Проверка коллизий
        this.checkCollisions();

        // Проверка завершения уровня
        this.checkLevelComplete();
    }

    /**
     * Проверка коллизий
     */
    checkCollisions() {
        if (!this.player) return;

        // Ограничение границами уровня
        if (this.levelWidth > 0) {
            // Левая граница
            if (this.player.x < 0) {
                this.player.x = 0;
                this.player.physics.velocityX = 0;
            }
            // Правая граница
            if (this.player.x + this.player.width > this.levelWidth) {
                this.player.x = this.levelWidth - this.player.width;
                this.player.physics.velocityX = 0;
            }
        }

        // Коллизия с платформами
        this.platforms.forEach(platform => {
            if (this.physicsManager.checkCollision(this.player, platform)) {
                const playerBottom = this.player.y + this.player.height;
                const playerTop = this.player.y;
                const playerRight = this.player.x + this.player.width;
                const playerLeft = this.player.x;
                
                const platformTop = platform.y;
                const platformBottom = platform.y + platform.height;
                const platformRight = platform.x + platform.width;
                const platformLeft = platform.x;
                
                // Определяем перекрытия
                const overlapTop = playerBottom - platformTop;
                const overlapBottom = platformBottom - playerTop;
                const overlapLeft = playerRight - platformLeft;
                const overlapRight = platformRight - playerLeft;
                
                // Определяем, с какой стороны произошло столкновение
                // Приоритет: сверху > снизу > слева/справа
                const wasMovingDown = this.player.physics.velocityY > 0;
                const wasMovingUp = this.player.physics.velocityY < 0;
                const wasMovingRight = this.player.physics.velocityX > 0;
                const wasMovingLeft = this.player.physics.velocityX < 0;
                
                // Проверяем столкновение сверху (приоритет для платформ)
                if (wasMovingDown && playerTop < platformTop && overlapTop > 0 && overlapTop < overlapBottom) {
                    this.player.y = platformTop - this.player.height;
                    this.player.physics.velocityY = 0;
                    this.player.onGround = true;
                }
                // Проверяем столкновение снизу
                else if (wasMovingUp && playerBottom > platformBottom && overlapBottom > 0 && overlapBottom < overlapTop) {
                    this.player.y = platformBottom;
                    this.player.physics.velocityY = 0;
                }
                // Проверяем столкновение справа (игрок входит слева)
                else if (wasMovingRight && playerLeft < platformLeft && overlapLeft > 0 && overlapLeft < overlapRight) {
                    this.player.x = platformLeft - this.player.width;
                    this.player.physics.velocityX = 0;
                }
                // Проверяем столкновение слева (игрок входит справа)
                else if (wasMovingLeft && playerRight > platformRight && overlapRight > 0 && overlapRight < overlapLeft) {
                    this.player.x = platformRight;
                    this.player.physics.velocityX = 0;
                }
                // Если нет движения, определяем по минимальному перекрытию
                else {
                    const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);
                    if (minOverlap === overlapTop && playerTop < platformTop) {
                        this.player.y = platformTop - this.player.height;
                        this.player.physics.velocityY = 0;
                        this.player.onGround = true;
                    } else if (minOverlap === overlapBottom) {
                        this.player.y = platformBottom;
                        this.player.physics.velocityY = 0;
                    } else if (minOverlap === overlapLeft) {
                        this.player.x = platformLeft - this.player.width;
                        this.player.physics.velocityX = 0;
                    } else if (minOverlap === overlapRight) {
                        this.player.x = platformRight;
                        this.player.physics.velocityX = 0;
                    }
                }
            }
        });
        
        // Коллизия с препятствиями (работают как платформы, но блокируют прохождение)
        this.obstacles.forEach((obstacle, index) => {
            if (this.physicsManager.checkCollision(this.player, obstacle)) {
                const playerBottom = this.player.y + this.player.height;
                const playerTop = this.player.y;
                const playerRight = this.player.x + this.player.width;
                const playerLeft = this.player.x;
                
                const obstacleTop = obstacle.y;
                const obstacleBottom = obstacle.y + obstacle.height;
                const obstacleRight = obstacle.x + obstacle.width;
                const obstacleLeft = obstacle.x;
                
                // Определяем перекрытия
                const overlapTop = playerBottom - obstacleTop;
                const overlapBottom = obstacleBottom - playerTop;
                const overlapLeft = playerRight - obstacleLeft;
                const overlapRight = obstacleRight - playerLeft;
                
                // Определяем, с какой стороны произошло столкновение
                const wasMovingDown = this.player.physics.velocityY > 0;
                const wasMovingUp = this.player.physics.velocityY < 0;
                const wasMovingRight = this.player.physics.velocityX > 0;
                const wasMovingLeft = this.player.physics.velocityX < 0;
                
                // Проверяем столкновение сверху (приоритет для препятствий)
                if (wasMovingDown && playerTop < obstacleTop && overlapTop > 0 && overlapTop < overlapBottom) {
                    this.player.y = obstacleTop - this.player.height;
                    this.player.physics.velocityY = 0;
                    this.player.onGround = true;
                }
                // Проверяем столкновение снизу
                else if (wasMovingUp && playerBottom > obstacleBottom && overlapBottom > 0 && overlapBottom < overlapTop) {
                    this.player.y = obstacleBottom;
                    this.player.physics.velocityY = 0;
                }
                // Проверяем столкновение справа (игрок входит слева)
                else if (wasMovingRight && playerLeft < obstacleLeft && overlapLeft > 0 && overlapLeft < overlapRight) {
                    this.player.x = obstacleLeft - this.player.width;
                    this.player.physics.velocityX = 0;
                    // Наносим урон при боковом столкновении
                    this.hitObstacle(obstacle);
                }
                // Проверяем столкновение слева (игрок входит справа)
                else if (wasMovingLeft && playerRight > obstacleRight && overlapRight > 0 && overlapRight < overlapLeft) {
                    this.player.x = obstacleRight;
                    this.player.physics.velocityX = 0;
                    // Наносим урон при боковом столкновении
                    this.hitObstacle(obstacle);
                }
                // Если нет движения, определяем по минимальному перекрытию
                else {
                    const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);
                    if (minOverlap === overlapTop && playerTop < obstacleTop) {
                        this.player.y = obstacleTop - this.player.height;
                        this.player.physics.velocityY = 0;
                        this.player.onGround = true;
                    } else if (minOverlap === overlapBottom) {
                        this.player.y = obstacleBottom;
                        this.player.physics.velocityY = 0;
                        // Наносим урон при столкновении снизу
                        this.hitObstacle(obstacle);
                    } else if (minOverlap === overlapLeft) {
                        this.player.x = obstacleLeft - this.player.width;
                        this.player.physics.velocityX = 0;
                        // Наносим урон при боковом столкновении
                        this.hitObstacle(obstacle);
                    } else if (minOverlap === overlapRight) {
                        this.player.x = obstacleRight;
                        this.player.physics.velocityX = 0;
                        // Наносим урон при боковом столкновении
                        this.hitObstacle(obstacle);
                    }
                }
            }
        });

        // Определяем нижнюю границу уровня (самая нижняя платформа или граница экрана)
        let levelBottom = this.height;
        if (this.platforms.length > 0) {
            levelBottom = Math.max(...this.platforms.map(p => p.y + p.height), this.height);
        }
        
        // Проверка на нижней границе уровня (земля уровня)
        if (this.player.y + this.player.height >= levelBottom - 1) {
            this.player.y = levelBottom - this.player.height;
            this.player.physics.velocityY = 0;
            this.player.onGround = true;
        }

        // Коллизия с препятствиями обрабатывается выше вместе с платформами

        // Коллизия с врагами (игнорируем во время смерти)
        if (!this.player.isDead && !this.player.isInvincible) {
            this.enemies.forEach((enemy, index) => {
                // Мертвые враги не наносят урон
                if (!enemy.isDead && this.physicsManager.checkCollision(this.player, enemy)) {
                    this.hitEnemy(enemy);
                }
            });
        }

        // Коллизия с бонусами
        this.bonuses.forEach((bonus, index) => {
            if (this.physicsManager.checkCollision(this.player, bonus)) {
                this.collectBonus(bonus);
                this.bonuses.splice(index, 1);
            }
        });

        // Коллизия с шипами (наносим урон только при наступлении сверху)
        if (!this.player.isDead && !this.player.isInvincible) {
            this.spikes.forEach((spike) => {
                // Проверяем горизонтальное пересечение
                const playerLeft = this.player.x;
                const playerRight = this.player.x + this.player.width;
                const spikeLeft = spike.x;
                const spikeRight = spike.x + spike.width;
                
                const overlapsX = playerRight > spikeLeft && playerLeft < spikeRight;
                
                if (overlapsX) {
                    const playerBottom = this.player.y + this.player.height;
                    const playerTop = this.player.y;
                    const spikeTop = spike.y;
                    const spikeBottom = spike.y + spike.height;
                    
                    // Урон наносится если:
                    // 1. Есть горизонтальное пересечение (overlapsX)
                    // 2. Игрок находится на земле (onGround) - значит стоит на платформе или на шипах
                    // 3. Нижняя часть игрока находится на уровне шипов (от их верха до низа + допуск)
                    // Учитываем, что когда игрок стоит на платформе, его playerBottom = platformTop,
                    // а spikeTop может быть равен platformTop или немного выше
                    if (this.player.onGround) {
                        // Игрок на земле - проверяем, находится ли он на уровне шипов
                        // Допуск увеличен, чтобы учесть, что игрок может стоять на платформе над шипами
                        const distanceToSpikeTop = Math.abs(playerBottom - spikeTop);
                        const distanceToSpikeBottom = Math.abs(playerBottom - spikeBottom);
                        
                        // Если нижняя часть игрока находится в пределах 15 пикселей от верха или низа шипов
                        if (distanceToSpikeTop <= 15 || distanceToSpikeBottom <= 15) {
                            this.hitSpike(spike);
                        }
                    } else {
                        // Игрок в воздухе - проверяем, падает ли он на шипы
                        // Урон наносится только если игрок падает и его нижняя часть близка к верху шипов
                        if (this.player.physics.velocityY > 0 && playerBottom >= spikeTop - 5 && playerBottom <= spikeTop + 10) {
                            this.hitSpike(spike);
                        }
                    }
                }
            });
        }
        
        // КРИТИЧНО: Проверяем, действительно ли игрок на земле после всех коллизий
        // Это предотвращает "стояние на воздухе"
        // Используем уже вычисленную levelBottom
        const wasOnGround = this.player.onGround;
        this.player.onGround = this.physicsManager.isOnGround(
            this.player,
            this.platforms,
            levelBottom
        );
        
        // Если игрок был на земле, но теперь не на земле - включаем гравитацию
        if (wasOnGround && !this.player.onGround && this.player.physics) {
            // Игрок больше не на земле - включаем гравитацию, если она была отключена
            if (!this.player.physics.gravity) {
                this.player.physics.gravity = true;
            }
        }
    }

    /**
     * Разместить врага на ближайшей платформе
     */
    placeEnemyOnPlatform(enemy) {
        let closestPlatform = null;
        let minDistance = Infinity;

        // Ищем ближайшую платформу под врагом (та же логика, что и в update)
        this.platforms.forEach(platform => {
            const enemyCenterX = enemy.x + enemy.width / 2;
            const enemyLeft = enemy.x;
            const enemyRight = enemy.x + enemy.width;
            const enemyBottom = enemy.y + enemy.height;
            const enemyTop = enemy.y;
            const platformLeft = platform.x;
            const platformRight = platform.x + platform.width;
            const platformTop = platform.y;
            const platformCenterX = platform.x + platform.width / 2;
            
            // Проверяем пересечение по X или близость
            const overlapsX = enemyRight > platformLeft && enemyLeft < platformRight;
            const closeX = Math.abs(enemyCenterX - platformCenterX) < (platform.width / 2 + enemy.width / 2 + 300);
            
            if (overlapsX || closeX) {
                // Вычисляем расстояние по Y
                const distanceY = Math.abs(enemyBottom - platformTop);
                
                // Если враг находится над платформой (не слишком далеко внизу)
                if (enemyBottom <= platformTop + 500 && enemyTop <= platformTop + 500) {
                    if (distanceY < minDistance) {
                        minDistance = distanceY;
                        closestPlatform = platform;
                    }
                }
            }
        });

        // Если нашли платформу, размещаем врага на ней
        if (closestPlatform) {
            enemy.y = closestPlatform.y - enemy.height;
            if (enemy.physics) {
                enemy.physics.velocityY = 0;
                enemy.physics.gravity = false; // Отключаем гравитацию
            }
            enemy.onGround = true;
        } else {
            // Если платформу не нашли, ищем самую близкую по горизонтали
            let nearestPlatform = null;
            let nearestDistance = Infinity;
            
            this.platforms.forEach(platform => {
                const enemyCenterX = enemy.x + enemy.width / 2;
                const platformCenterX = platform.x + platform.width / 2;
                const distanceX = Math.abs(enemyCenterX - platformCenterX);
                
                if (distanceX < nearestDistance) {
                    nearestDistance = distanceX;
                    nearestPlatform = platform;
                }
            });
            
            if (nearestPlatform) {
                // Размещаем врага на ближайшей платформе и центрируем по X
                enemy.x = nearestPlatform.x + (nearestPlatform.width / 2) - (enemy.width / 2);
                enemy.y = nearestPlatform.y - enemy.height;
                if (enemy.physics) {
                    enemy.physics.velocityY = 0;
                    enemy.physics.gravity = false; // Отключаем гравитацию
                }
                enemy.onGround = true;
            }
        }
    }

    /**
     * Обработка столкновения с препятствием
     */
    hitObstacle(obstacle) {
        if (this.player.isInvincible || this.player.isDead) return;
        
        this.lives--;
        this.soundManager.playSound('enemy');
        this.updateUI();
        
        if (this.lives <= 0) {
            // Запускаем анимацию смерти
            this.player.isDead = true;
            this.player.deathAnimationTime = 0;
            this.player.currentAnimation = 'dead';
            this.player.physics.velocityX = 0;
            this.player.physics.velocityY = 0;
            // Воспроизводим звук смерти героя
            this.soundManager.playSound('death');
        } else {
            // Активируем неуязвимость на 1 секунду
            this.player.isInvincible = true;
            this.player.invincibilityTime = 0;
        }
    }

    /**
     * Обработка столкновения с врагом
     */
    hitEnemy(enemy) {
        // Игрок всегда получает урон при соприкосновении с врагом
        // Убийство врагов возможно только атакой
        // Игнорируем во время смерти или неуязвимости
        if (!this.player.isAttacking && !this.player.isInvincible && !this.player.isDead) {
            this.hitObstacle(enemy);
        }
    }

    /**
     * Обработка столкновения с шипами
     */
    hitSpike(spike) {
        if (this.player.isInvincible || this.player.isDead) return;
        
        this.lives--;
        this.soundManager.playSound('enemy');
        this.updateUI();
        
        if (this.lives <= 0) {
            // Запускаем анимацию смерти
            this.player.isDead = true;
            this.player.deathAnimationTime = 0;
            this.player.currentAnimation = 'dead';
            this.player.physics.velocityX = 0;
            this.player.physics.velocityY = 0;
            // Воспроизводим звук смерти героя
            this.soundManager.playSound('death');
        } else {
            // Активируем неуязвимость на 1 секунду
            this.player.isInvincible = true;
            this.player.invincibilityTime = 0;
        }
    }

    /**
     * Сбор бонуса
     */
    collectBonus(bonus) {
        this.addScore(bonus.points || 50);
        // Добавляем жизнь за каждый собранный бонус
        this.lives++;
        this.soundManager.playSound('collect');
        this.eventManager.emit('bonusCollected', bonus);
        this.updateUI(); // Обновляем UI для отображения новых жизней
    }

    /**
     * Добавить очки
     */
    addScore(points) {
        this.score += points;
        this.updateUI();
    }

    /**
     * Проверка завершения уровня
     */
    checkLevelComplete() {
        // Проверяем состояние врат
        this.gates.forEach(gate => {
            gate.checkOpen();
        });
        
        // Уровень завершен, когда игрок проходит через открытые ворота
        this.gates.forEach(gate => {
            if (gate.isOpen && this.physicsManager.checkCollision(this.player, gate)) {
                this.nextLevel().catch(error => {
                    console.error('Ошибка при переходе на следующий уровень:', error);
                    this.gameOver();
                });
            }
        });
    }

    /**
     * Следующий уровень
     */
    async nextLevel() {
        this.currentLevel++;
        const level = this.levelManager.loadLevel(this.currentLevel);
        
        if (!level) {
            // Игра завершена - показываем экран победы
            this.showVictory();
        } else {
            await this.loadLevel(this.currentLevel);
        }
    }

    /**
     * Конец игры
     */
    gameOver() {
        this.state = 'gameover';
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        // Останавливаем фоновую музыку (на случай, если она играет)
        if (this.soundManager) {
            this.soundManager.stopMusic();
            // Воспроизводим музыку поражения
            this.soundManager.playMusic('gameover');
        }
        this.soundManager.playSound('gameover');
        this.showScreen('game-over-screen');
        const finalScore = document.getElementById('final-score');
        if (finalScore) {
            finalScore.textContent = `Очки: ${this.score}`;
        }
    }

    /**
     * Показать экран победы
     */
    showVictory() {
        this.state = 'victory';
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        // Останавливаем фоновую музыку (на случай, если она играет)
        if (this.soundManager) {
            this.soundManager.stopMusic();
            // Воспроизводим музыку победы
            this.soundManager.playMusic('victory');
        }
        this.showScreen('victory-screen');
        
        // Запускаем видео победы
        const victoryVideo = document.getElementById('victory-video');
        if (victoryVideo) {
            victoryVideo.play().catch(err => {
                console.warn('Не удалось автоматически воспроизвести видео победы:', err);
            });
        }
        
        const victoryFinalScore = document.getElementById('victory-final-score');
        if (victoryFinalScore) {
            victoryFinalScore.textContent = `Очки: ${this.score}`;
        }
    }

    /**
     * Обновление камеры
     */
    updateCamera() {
        if (!this.player) return;

        // Целевая позиция камеры - центр игрока
        const targetX = this.player.x + this.player.width / 2 - this.width / (2 * this.camera.scale);
        const targetY = this.player.y + this.player.height / 2 - this.height / (2 * this.camera.scale);

        // Плавное следование камеры
        this.camera.x += (targetX - this.camera.x) * this.camera.followSpeed;
        this.camera.y += (targetY - this.camera.y) * this.camera.followSpeed;

        // Ограничение камеры границами уровня
        if (this.levelWidth > 0) {
            const maxCameraX = this.levelWidth - this.width / this.camera.scale;
            this.camera.x = Math.max(0, Math.min(this.camera.x, maxCameraX));
        }
    }

    /**
     * Отрисовка игры
     */
    render() {
        // Очистка canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Применяем трансформацию камеры
        this.ctx.save();
        this.ctx.scale(this.camera.scale, this.camera.scale);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Отрисовка фонового изображения (повторяющееся изображение)
        this.renderBackgroundImage();

        // Отрисовка визуальных слоев тайлов
        try {
            if (!this.currentLevelData || !this.currentLevelData.tileLayers || this.currentLevelData.tileLayers.length === 0) {
                throw new Error('Нет данных тайлов для рендеринга! Игра не может работать без тайлов.');
            }
            this.renderTileLayers();
        } catch (error) {
            console.error('Критическая ошибка рендеринга тайлов:', error);
            // Останавливаем игру, так как без тайлов она не может работать
            this.gameOver();
            throw error;
        }

        // Отрисовка врагов
        this.enemies.forEach(enemy => {
            enemy.render(this.ctx);
        });


        // Отрисовка бонусов
        this.bonuses.forEach(bonus => {
            bonus.render(this.ctx);
        });

        // Отрисовка игрока
        if (this.player) {
            this.player.render(this.ctx);
        }

        // Отрисовка врат
        this.gates.forEach(gate => {
            gate.render(this.ctx);
        });

        // Восстанавливаем контекст
        this.ctx.restore();
        
        // Отрисовка мини-карты (поверх всего)
        this.renderMinimap();
    }

    /**
     * Отрисовка мини-карты
     */
    renderMinimap() {
        if (!this.player || this.levelWidth === 0) return;

        const minimapWidth = 200;
        const minimapHeight = 150;
        const minimapX = this.width - minimapWidth - 10;
        const minimapY = 10;
        const scale = minimapWidth / this.levelWidth;

        // Фон мини-карты
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(minimapX, minimapY, minimapWidth, minimapHeight);
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(minimapX, minimapY, minimapWidth, minimapHeight);

        // Отрисовка платформ на мини-карте
        this.ctx.fillStyle = 'rgba(139, 69, 19, 0.8)'; // Коричневый для платформ
        this.platforms.forEach(platform => {
            this.ctx.fillRect(
                minimapX + platform.x * scale,
                minimapY + platform.y * scale * 0.3, // Сжимаем по Y для лучшей видимости
                platform.width * scale,
                platform.height * scale * 0.3
            );
        });

        // Отрисовка препятствий
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; // Красный для препятствий
        this.obstacles.forEach(obstacle => {
            this.ctx.fillRect(
                minimapX + obstacle.x * scale,
                minimapY + obstacle.y * scale * 0.3,
                obstacle.width * scale,
                obstacle.height * scale * 0.3
            );
        });

        // Отрисовка врагов
        this.ctx.fillStyle = 'rgba(255, 0, 0, 1)'; // Красный для врагов
        this.enemies.forEach(enemy => {
            this.ctx.fillRect(
                minimapX + enemy.x * scale,
                minimapY + enemy.y * scale * 0.3,
                4,
                4
            );
        });

        // Отрисовка бонусов
        this.ctx.fillStyle = 'rgba(255, 215, 0, 1)'; // Золотой для бонусов
        this.bonuses.forEach(bonus => {
            this.ctx.fillRect(
                minimapX + bonus.x * scale,
                minimapY + bonus.y * scale * 0.3,
                3,
                3
            );
        });

        // Отрисовка врат
        this.gates.forEach(gate => {
            this.ctx.fillStyle = gate.isOpen ? 'rgba(0, 255, 0, 0.8)' : 'rgba(139, 69, 19, 0.8)';
            this.ctx.fillRect(
                minimapX + gate.x * scale,
                minimapY + gate.y * scale * 0.3,
                gate.width * scale,
                gate.height * scale * 0.3
            );
        });

        // Отрисовка игрока
        this.ctx.fillStyle = 'rgba(0, 255, 0, 1)'; // Зеленый для игрока
        this.ctx.fillRect(
            minimapX + this.player.x * scale,
            minimapY + this.player.y * scale * 0.3,
            5,
            5
        );

        // Область видимости камеры
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            minimapX + this.camera.x * scale,
            minimapY + this.camera.y * scale * 0.3,
            (this.width / this.camera.scale) * scale,
            (this.height / this.camera.scale) * scale * 0.3
        );
    }

    /**
     * Обновление UI
     */
    updateUI() {
        const levelDisplay = document.getElementById('level-display');
        const scoreDisplay = document.getElementById('score-display');
        const livesDisplay = document.getElementById('lives-display');
        
        if (levelDisplay) levelDisplay.textContent = this.currentLevel;
        if (scoreDisplay) scoreDisplay.textContent = this.score;
        if (livesDisplay) livesDisplay.textContent = this.lives;
    }

    /**
     * Показать экран
     */
    showScreen(screenId) {
        // Останавливаем видео меню, если оно играет
        const menuVideo = document.getElementById('menu-video');
        if (menuVideo && screenId !== 'menu-screen') {
            menuVideo.pause();
        }
        
        // Останавливаем видео победы, если оно играет
        const victoryVideo = document.getElementById('victory-video');
        if (victoryVideo && screenId !== 'victory-screen') {
            victoryVideo.pause();
        }
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        } else {
            console.error(`Экран с ID "${screenId}" не найден`);
        }
    }

    /**
     * Показать меню
     */
    showMenu() {
        this.state = 'menu';
        this.showScreen('menu-screen');
        
        // Запускаем видео меню
        const menuVideo = document.getElementById('menu-video');
        if (menuVideo) {
            menuVideo.play().catch(err => {
                console.warn('Не удалось автоматически воспроизвести видео:', err);
            });
        }
        
        // Воспроизводим фоновую музыку главного меню
        if (this.soundManager) {
            this.soundManager.stopMusic(); // Останавливаем текущую музыку (если есть)
            this.soundManager.playMusic('main_theme'); // Воспроизводим музыку главного меню
        }
    }

    /**
     * Показать таблицу рекордов
     */
    showScores() {
        console.log('Показ таблицы рекордов...');
        this.showScreen('scores-screen');
        this.displayScores();
    }

    /**
     * Показать настройки
     */
    showSettings() {
        console.log('Показ настроек...');
        this.showScreen('settings-screen');
    }

    /**
     * Переключить звук
     */
    toggleSound() {
        const enabled = this.soundManager.toggle();
        const soundStatus = document.getElementById('sound-status');
        if (soundStatus) {
            soundStatus.textContent = enabled ? 'Вкл' : 'Выкл';
        }
    }

    /**
     * Загрузить рекорды
     */
    loadScores() {
        this.scoreManager.loadScores();
    }

    /**
     * Отобразить рекорды
     */
    displayScores() {
        const scores = this.scoreManager.getScores();
        const scoresList = document.getElementById('scores-list');
        if (!scoresList) return;
        scoresList.innerHTML = '';

        if (scores.length === 0) {
            scoresList.innerHTML = '<div style="text-align: center; padding: 20px;">Нет сохраненных рекордов</div>';
            return;
        }

        scores.forEach((score, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            scoreItem.innerHTML = `
                <span>${index + 1}. ${score.name}</span>
                <span>${score.score}</span>
            `;
            scoresList.appendChild(scoreItem);
        });
    }

    /**
     * Загрузить tilesets для уровня
     */
    async loadTilesets(tilesets) {
        if (!tilesets || tilesets.length === 0) {
            throw new Error('Нет tilesets для загрузки!');
        }

        for (const tileset of tilesets) {
            if (tileset.source) {
                // Внешний tileset файл (.tsx) - нужно загрузить
                // Для упрощения, предполагаем что изображение указано в .tsx файле
                // В реальности нужно парсить XML, но пока используем прямое указание пути
                const tilesetPath = tileset.source.replace('.tsx', '.png').replace('map_tileset', 'MapAssets/Tileset');
                const imagePath = tilesetPath.startsWith('assets/') ? tilesetPath : `assets/${tilesetPath}`;
                await this.loadTilesetImage(tileset.firstgid, imagePath, 544, 384, 17, 32, 32);
            } else if (tileset.image) {
                // Встроенный tileset
                let imagePath = tileset.image;
                // Обрабатываем разные варианты путей
                if (imagePath.startsWith('../assets/')) {
                    imagePath = imagePath.replace('../assets/', 'assets/');
                } else if (imagePath.startsWith('../')) {
                    imagePath = imagePath.replace('../', 'assets/');
                } else if (!imagePath.startsWith('assets/')) {
                    imagePath = `assets/${imagePath}`;
                }
                
                await this.loadTilesetImage(
                    tileset.firstgid || 1,
                    imagePath,
                    tileset.imagewidth || 544,
                    tileset.imageheight || 384,
                    tileset.columns || 17,
                    tileset.tilewidth || 32,
                    tileset.tileheight || 32
                );
            } else {
                throw new Error(`Tileset не содержит информации об изображении: ${JSON.stringify(tileset)}`);
            }
        }
    }

    /**
     * Загрузить изображение tileset
     */
    async loadTilesetImage(firstgid, imagePath, imageWidth, imageHeight, columns, tileWidth, tileHeight) {
        const image = await this.spriteManager.loadSprite(imagePath);
        if (!image) {
            throw new Error(`Не удалось загрузить tileset изображение: ${imagePath}`);
        }
        
        this.tilesetImages.set(firstgid, {
            image: image,
            firstgid: firstgid,
            imageWidth: imageWidth,
            imageHeight: imageHeight,
            columns: columns,
            tileWidth: tileWidth,
            tileHeight: tileHeight,
            rows: Math.floor(imageHeight / tileHeight)
        });
        
        console.log(`✅ Tileset загружен: ${imagePath} (firstgid=${firstgid})`);
    }

    /**
     * Отрисовка слоев тайлов
     */
    renderTileLayers() {
        if (!this.currentLevelData) {
            throw new Error('Нет данных уровня для рендеринга тайлов!');
        }

        if (!this.currentLevelData.tileLayers || this.currentLevelData.tileLayers.length === 0) {
            throw new Error('Уровень не содержит слоев тайлов!');
        }

        const level = this.currentLevelData;
        const tileWidth = level.tileWidth || 32;
        const tileHeight = level.tileHeight || 32;

        // Рендерим слои по порядку (от фона к переднему плану)
        level.tileLayers.forEach(layer => {
            if (!layer.visible || layer.opacity === 0) return;

            this.ctx.save();
            this.ctx.globalAlpha = layer.opacity || 1;

            const layerWidth = layer.width;
            const layerHeight = layer.height;

            // Пропускаем фоновый слой, он будет отрендерен отдельно
            if (layer.name === 'background') {
                // Фон рендерится отдельно через renderBackgroundImage
                this.ctx.restore();
                return; // В forEach используем return вместо continue
            } else {
                // Рендерим обычные слои
                layer.data.forEach((tileIndex, index) => {
                    if (tileIndex === 0) return; // Пустой тайл

                    const x = (index % layerWidth) * tileWidth;
                    const y = Math.floor(index / layerWidth) * tileHeight;

                    // Находим tileset для этого тайла
                    const tilesetInfo = this.getTilesetForTile(tileIndex, level.tilesets);
                    if (!tilesetInfo || !tilesetInfo.image) {
                        // Пропускаем тайл, если tileset не загружен (не критичная ошибка для отдельных тайлов)
                        return;
                    }

                    // Вычисляем реальный ID тайла
                    const realTileId = tileIndex - tilesetInfo.firstgid;
                    if (realTileId < 0) return;

                    // Вычисляем позицию тайла в tileset изображении
                    const tileX = (realTileId % tilesetInfo.columns) * tilesetInfo.tileWidth;
                    const tileY = Math.floor(realTileId / tilesetInfo.columns) * tilesetInfo.tileHeight;

                    // Рендерим тайл
                    this.ctx.drawImage(
                        tilesetInfo.image,
                        tileX, tileY, tilesetInfo.tileWidth, tilesetInfo.tileHeight,
                        x, y, tileWidth, tileHeight
                    );
                });
            }

            this.ctx.restore();
        });
    }

    /**
     * Получить информацию о tileset для слоя
     */
    getTilesetForLayer(tilesets) {
        if (!tilesets || tilesets.length === 0) return null;
        const firstTileset = tilesets[0];
        return this.tilesetImages.get(firstTileset.firstgid || 1);
    }

    /**
     * Получить информацию о tileset для конкретного тайла
     */
    getTilesetForTile(tileIndex, tilesets) {
        if (!tilesets || tilesets.length === 0) return null;

        // Находим tileset с подходящим firstgid
        for (let i = tilesets.length - 1; i >= 0; i--) {
            const tileset = tilesets[i];
            const firstgid = tileset.firstgid || 1;
            if (tileIndex >= firstgid) {
                return this.tilesetImages.get(firstgid);
            }
        }

        return null;
    }

    /**
     * Сохранить результат
     */
    saveScore() {
        const nameInput = document.getElementById('player-name');
        const name = nameInput ? nameInput.value.trim() || 'Игрок' : 'Игрок';
        this.scoreManager.addScore(name, this.score);
        this.scoreManager.saveScores();
        this.showScores();
    }

    /**
     * Сохранить результат с экрана победы
     */
    saveVictoryScore() {
        const nameInput = document.getElementById('victory-player-name');
        const name = nameInput ? nameInput.value.trim() || 'Игрок' : 'Игрок';
        this.scoreManager.addScore(name, this.score);
        this.scoreManager.saveScores();
        this.showScores();
    }

    /**
     * Рендеринг повторяющегося фонового изображения
     */
    renderBackgroundImage() {
        if (!this.backgroundImage || !this.currentLevelData || !this.currentLevelData.backgroundImage) {
            return;
        }

        const bgInfo = this.currentLevelData.backgroundImage;
        if (!bgInfo.visible) return;

        // Устанавливаем прозрачность
        this.ctx.save();
        this.ctx.globalAlpha = bgInfo.opacity || 1;

        // Вычисляем видимую область с учетом камеры
        const canvasWidth = this.width / this.camera.scale;
        const canvasHeight = this.height / this.camera.scale;

        // Видимая область в мировых координатах
        const viewLeft = this.camera.x;
        const viewTop = this.camera.y;
        const viewRight = this.camera.x + canvasWidth;
        const viewBottom = this.camera.y + canvasHeight;

        // Размеры фонового изображения
        const bgWidth = this.backgroundImage.width;
        const bgHeight = this.backgroundImage.height;

        // Применяем смещение из настроек слоя
        const offsetX = bgInfo.offsetx || 0;
        const offsetY = (bgInfo.offsety || 0)-100; // Используем только значения из Tiled, без дополнительного смещения

        // Вычисляем область, которую нужно отрендерить
        // Начинаем от начала видимой области с учетом смещения
        const startX = Math.floor((viewLeft - offsetX) / bgWidth) * bgWidth + offsetX;
        const startY = Math.floor((viewTop - offsetY) / bgHeight) * bgHeight + offsetY;
        const endX = viewRight;
        const endY = viewBottom;

        // Рендерим повторяющееся изображение
        for (let y = startY; y <= endY; y += bgHeight) {
            for (let x = startX; x <= endX; x += bgWidth) {
                this.ctx.drawImage(
                    this.backgroundImage,
                    x, y,
                    bgWidth, bgHeight
                );
            }
        }

        this.ctx.restore();
    }

}
