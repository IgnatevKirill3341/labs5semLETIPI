import { Enemy } from '../entities/Enemy.js';
import { Bonus } from '../entities/Bonus.js';
import { Gate } from '../entities/Gate.js';

/**
 * Менеджер уровней
 * Управляет загрузкой и созданием уровней, поддерживает Tiled формат
 */
export class LevelManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.levels = [];
        this.currentLevelData = null;
        this.levelsReady = false;
        this.initLevels();
    }

    /**
     * Инициализация уровней
     */
    initLevels() {
        // Пытаемся загрузить уровень 1 из Tiled JSON
        this.loadLevelFromFile('levels/level1.json').then(level1 => {
            if (level1 && level1.platforms && level1.platforms.length > 0) {
                // Добавляем gates из endpoint
                if (level1.endPoint) {
                    level1.gates = [
                        new Gate(
                            level1.endPoint.x,
                            level1.endPoint.y,
                            level1.endPoint.width || 80,
                            level1.endPoint.height || 100,
                            this.gameManager
                        )
                    ];
                }
                this.levels[0] = level1;
                console.log('Уровень 1 загружен из Tiled JSON');
            } else {
                // Если не удалось загрузить, используем программное создание
                if (this.levels.length === 0) {
                    this.levels.push(this.createLevel1());
                }
            }
            
            // Загружаем уровень 2 из Tiled JSON
            return this.loadLevelFromFile('levels/level2.json');
        }).then(level2 => {
            if (level2 && level2.platforms && level2.platforms.length > 0) {
                // Добавляем gates из endpoint
                if (level2.endPoint) {
                    level2.gates = [
                        new Gate(
                            level2.endPoint.x,
                            level2.endPoint.y,
                            level2.endPoint.width || 80,
                            level2.endPoint.height || 100,
                            this.gameManager
                        )
                    ];
                }
                this.levels[1] = level2;
                console.log('Уровень 2 загружен из Tiled JSON');
            } else {
                // Если не удалось загрузить уровень 2, используем программное создание
                if (this.levels.length === 1) {
                    this.levels.push(this.createLevel2());
                    console.log('Уровень 2 создан программно');
                }
            }
            this.levelsReady = true;
        }).catch(error => {
            console.warn('Ошибка загрузки уровней:', error);
            // Если не удалось загрузить уровень 1, используем программное создание
            if (this.levels.length === 0) {
                this.levels.push(this.createLevel1());
            }
            // Если не удалось загрузить уровень 2, создаем программно (если есть метод)
            if (this.levels.length === 1 && typeof this.createLevel2 === 'function') {
                this.levels.push(this.createLevel2());
            }
            this.levelsReady = true;
        });
    }

    /**
     * Создание уровня 1
     */
    createLevel1() {
        const levelWidth = 3000; // Увеличенная ширина уровня
        // Базовый уровень Y = 800 (нижняя платформа, перемещено ниже)
        // Уровень 1: Y = 800 (земля)
        // Уровень 2: Y = 650 (первая платформа вверх, разница 150)
        // Уровень 3: Y = 500 (вторая платформа вверх, разница 150)
        // Уровень 4: Y = 350 (третья платформа вверх, разница 150)
        // Высота платформ уменьшена до 20 для возможности запрыгивания
        
        const level = {
            playerStartX: 50,
            playerStartY: 730, // На первой платформе (Y=750 - высота игрока 50 = 700, но для визуального старта 730)
            width: levelWidth,
            platforms: [
                // Уровень 1 (земля) - Y = 750 (поднято до уровня врагов)
                { x: 0, y: 750, width: 300, height: 20, color: '#8B4513' },
                { x: 400, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 700, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 1000, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 1300, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 1600, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 1900, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 2200, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 2500, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 2800, y: 750, width: 200, height: 20, color: '#8B4513' },
                
                // Уровень 2 - Y = 600 (достижимо прыжком с земли)
                { x: 300, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 600, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 900, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 1200, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 1500, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 1800, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 2100, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 2400, y: 600, width: 150, height: 20, color: '#8B4513' },
                
                // Уровень 3 - Y = 450 (достижимо прыжком с уровня 2)
                { x: 450, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 750, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 1050, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 1350, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 1650, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 1950, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 2250, y: 450, width: 120, height: 20, color: '#8B4513' },
                
                // Уровень 4 - Y = 300 (достижимо прыжком с уровня 3, максимум 3 платформы вверх)
                { x: 600, y: 300, width: 100, height: 20, color: '#8B4513' },
                { x: 900, y: 300, width: 100, height: 20, color: '#8B4513' },
                { x: 1200, y: 300, width: 100, height: 20, color: '#8B4513' },
                { x: 1500, y: 300, width: 100, height: 20, color: '#8B4513' },
                { x: 1800, y: 300, width: 100, height: 20, color: '#8B4513' },
            ],
            obstacles: [
                // Препятствия на разных уровнях
                // Уровень 1 (земля) - Y = 750
                { x: 350, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 750, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 1150, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 1550, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 1950, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 2350, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 2750, y: 720, width: 30, height: 30, color: '#FF0000' },
                
                // Уровень 2 - Y = 600
                { x: 450, y: 570, width: 30, height: 30, color: '#FF0000' },
                { x: 750, y: 570, width: 30, height: 30, color: '#FF0000' },
                { x: 1050, y: 570, width: 30, height: 30, color: '#FF0000' },
                { x: 1350, y: 570, width: 30, height: 30, color: '#FF0000' },
                { x: 1650, y: 570, width: 30, height: 30, color: '#FF0000' },
                { x: 1950, y: 570, width: 30, height: 30, color: '#FF0000' },
                
                // Уровень 3 - Y = 450
                { x: 500, y: 420, width: 30, height: 30, color: '#FF0000' },
                { x: 800, y: 420, width: 30, height: 30, color: '#FF0000' },
                { x: 1100, y: 420, width: 30, height: 30, color: '#FF0000' },
                { x: 1400, y: 420, width: 30, height: 30, color: '#FF0000' },
                
                // Уровень 4 - Y = 300
                { x: 650, y: 270, width: 30, height: 30, color: '#FF0000' },
                { x: 950, y: 270, width: 30, height: 30, color: '#FF0000' },
                { x: 1250, y: 270, width: 30, height: 30, color: '#FF0000' },
            ],
            enemies: [
                // Враги размещаются на платформах: Y платформы (750) - высота врага (50) = 700
                // Но для правильного отображения ставим на Y=750 (платформа на Y=750, враг на Y=700)
                new Enemy(400, 700, this.gameManager, 'patrol'),
                new Enemy(700, 700, this.gameManager, 'patrol'),
                new Enemy(1000, 700, this.gameManager, 'patrol'),
                new Enemy(1300, 700, this.gameManager, 'patrol'),
                new Enemy(1600, 700, this.gameManager, 'patrol'),
                new Enemy(1900, 700, this.gameManager, 'patrol'),
            ],
            bonuses: [
                new Bonus(330, 720, 'coin'),
                new Bonus(630, 570, 'coin'),
                new Bonus(930, 570, 'coin'),
                new Bonus(1230, 520, 'coin'),
                new Bonus(480, 420, 'health'),
                new Bonus(780, 420, 'coin'),
                new Bonus(630, 270, 'powerup'),
            ],
            gates: [
                new Gate(levelWidth - 100, 650, 80, 100, this.gameManager)
            ]
        };

        return level;
    }

    /**
     * Создание уровня 2
     */
    createLevel2() {
        const levelWidth = 3500; // Увеличенная ширина уровня
        // Базовый уровень Y = 800 (нижняя платформа, перемещено ниже)
        // Уровень 1: Y = 800 (земля)
        // Уровень 2: Y = 650 (первая платформа вверх, разница 150)
        // Уровень 3: Y = 500 (вторая платформа вверх, разница 150)
        // Уровень 4: Y = 350 (третья платформа вверх, разница 150)
        // Высота платформ уменьшена до 20 для возможности запрыгивания
        
        const level = {
            playerStartX: 50,
            playerStartY: 730, // На первой платформе
            width: levelWidth,
            platforms: [
                // Уровень 1 (земля) - Y = 750 (поднято до уровня врагов)
                { x: 0, y: 750, width: 300, height: 20, color: '#8B4513' },
                { x: 400, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 700, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 1000, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 1300, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 1600, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 1900, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 2200, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 2500, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 2800, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 3100, y: 750, width: 200, height: 20, color: '#8B4513' },
                { x: 3300, y: 750, width: 200, height: 20, color: '#8B4513' },
                
                // Уровень 2 - Y = 600 (достижимо прыжком с земли)
                { x: 300, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 600, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 900, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 1200, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 1500, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 1800, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 2100, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 2400, y: 600, width: 150, height: 20, color: '#8B4513' },
                { x: 2700, y: 600, width: 150, height: 20, color: '#8B4513' },
                
                // Уровень 3 - Y = 450 (достижимо прыжком с уровня 2)
                { x: 450, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 750, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 1050, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 1350, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 1650, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 1950, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 2250, y: 450, width: 120, height: 20, color: '#8B4513' },
                { x: 2550, y: 450, width: 120, height: 20, color: '#8B4513' },
                
                // Уровень 4 - Y = 300 (достижимо прыжком с уровня 3, максимум 3 платформы вверх)
                { x: 600, y: 300, width: 100, height: 20, color: '#8B4513' },
                { x: 900, y: 300, width: 100, height: 20, color: '#8B4513' },
                { x: 1200, y: 300, width: 100, height: 20, color: '#8B4513' },
                { x: 1500, y: 300, width: 100, height: 20, color: '#8B4513' },
                { x: 1800, y: 300, width: 100, height: 20, color: '#8B4513' },
                { x: 2100, y: 300, width: 100, height: 20, color: '#8B4513' },
            ],
            obstacles: [
                // Препятствия на разных уровнях
                // Уровень 1 (земля) - Y = 750
                { x: 350, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 750, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 1150, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 1550, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 1950, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 2350, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 2750, y: 720, width: 30, height: 30, color: '#FF0000' },
                { x: 3150, y: 720, width: 30, height: 30, color: '#FF0000' },
                
                // Уровень 2 - Y = 600
                { x: 450, y: 570, width: 30, height: 30, color: '#FF0000' },
                { x: 750, y: 570, width: 30, height: 30, color: '#FF0000' },
                { x: 1050, y: 570, width: 30, height: 30, color: '#FF0000' },
                { x: 1350, y: 570, width: 30, height: 30, color: '#FF0000' },
                { x: 1650, y: 570, width: 30, height: 30, color: '#FF0000' },
                { x: 1950, y: 570, width: 30, height: 30, color: '#FF0000' },
                { x: 2250, y: 570, width: 30, height: 30, color: '#FF0000' },
                
                // Уровень 3 - Y = 450
                { x: 500, y: 420, width: 30, height: 30, color: '#FF0000' },
                { x: 800, y: 420, width: 30, height: 30, color: '#FF0000' },
                { x: 1100, y: 420, width: 30, height: 30, color: '#FF0000' },
                { x: 1400, y: 420, width: 30, height: 30, color: '#FF0000' },
                { x: 1700, y: 420, width: 30, height: 30, color: '#FF0000' },
                
                // Уровень 4 - Y = 300
                { x: 650, y: 270, width: 30, height: 30, color: '#FF0000' },
                { x: 950, y: 270, width: 30, height: 30, color: '#FF0000' },
                { x: 1250, y: 270, width: 30, height: 30, color: '#FF0000' },
                { x: 1550, y: 270, width: 30, height: 30, color: '#FF0000' },
            ],
            enemies: [
                // Враги размещаются на платформах: Y платформы (750) - высота врага (50) = 700
                new Enemy(400, 700, this.gameManager, 'patrol'),
                new Enemy(700, 700, this.gameManager, 'patrol'),
                new Enemy(1000, 700, this.gameManager, 'patrol'),
                new Enemy(1300, 700, this.gameManager, 'patrol'),
                new Enemy(1600, 700, this.gameManager, 'patrol'),
                new Enemy(1900, 700, this.gameManager, 'patrol'),
                new Enemy(2200, 700, this.gameManager, 'patrol'),
                new Enemy(2500, 700, this.gameManager, 'patrol'),
            ],
            bonuses: [
                new Bonus(330, 720, 'coin'),
                new Bonus(630, 570, 'coin'),
                new Bonus(930, 570, 'coin'),
                new Bonus(1230, 520, 'coin'),
                new Bonus(480, 420, 'health'),
                new Bonus(780, 420, 'coin'),
                new Bonus(1080, 420, 'coin'),
                new Bonus(630, 270, 'powerup'),
                new Bonus(930, 270, 'coin'),
            ],
            gates: [
                new Gate(levelWidth - 100, 650, 80, 100, this.gameManager)
            ]
        };

        return level;
    }

    /**
     * Загрузить уровень из Tiled JSON
     * @param {Object} tiledData - Данные из Tiled в формате JSON
     */
    loadFromTiled(tiledData) {
        const level = {
            playerStartX: 0,
            playerStartY: 0,
            width: (tiledData.width || 100) * (tiledData.tilewidth || 32),
            platforms: [],
            obstacles: [],
            enemies: [],
            bonuses: [],
            spikes: [], // Шипы
            gates: [],
            endPoint: null,
            tileLayers: [], // Визуальные слои тайлов для рендеринга
            tilesets: [], // Информация о tilesets
            backgroundImage: null // Фоновое изображение для повторяющегося фона
        };

        if (!tiledData || !tiledData.layers) {
            return level;
        }

        const tileWidth = tiledData.tilewidth || 32;
        const tileHeight = tiledData.tileheight || 32;

        // Сохраняем информацию о tilesets
        if (tiledData.tilesets) {
            level.tilesets = tiledData.tilesets.map(tileset => {
                // Если это ссылка на внешний файл, нужно будет загрузить его отдельно
                if (tileset.source) {
                    return {
                        firstgid: tileset.firstgid,
                        source: tileset.source,
                        name: tileset.name || 'tileset'
                    };
                } else {
                    // Встроенный tileset
                    return {
                        firstgid: tileset.firstgid || 1,
                        name: tileset.name || 'tileset',
                        tilewidth: tileset.tilewidth || tileWidth,
                        tileheight: tileset.tileheight || tileHeight,
                        image: tileset.image,
                        imagewidth: tileset.imagewidth,
                        imageheight: tileset.imageheight,
                        columns: tileset.columns
                    };
                }
            });
        }

        tiledData.layers.forEach(layer => {
            if (layer.type === 'tilelayer' && layer.data) {
                // Сохраняем визуальный слой для рендеринга
                level.tileLayers.push({
                    name: layer.name,
                    data: layer.data,
                    width: layer.width,
                    height: layer.height,
                    opacity: layer.opacity !== undefined ? layer.opacity : 1,
                    visible: layer.visible !== undefined ? layer.visible : true,
                    offsetx: layer.offsetx || 0,
                    offsety: layer.offsety || 0
                });
                
                // Обработка тайлов для коллизий
                this.processTileLayer(layer, level, tileWidth, tileHeight, tiledData);
            } else if (layer.type === 'objectgroup') {
                // Обработка объектов
                this.processObjectLayer(layer, level, tileWidth, tileHeight);
            } else if (layer.type === 'imagelayer' && layer.name === 'background') {
                // Сохраняем информацию о фоновом изображении
                level.backgroundImage = {
                    image: layer.image,
                    offsetx: layer.offsetx || 0,
                    offsety: layer.offsety || 0,
                    opacity: layer.opacity !== undefined ? layer.opacity : 1,
                    visible: layer.visible !== undefined ? layer.visible : true
                };
            }
        });

        level.tileWidth = tileWidth;
        level.tileHeight = tileHeight;

        return level;
    }

    /**
     * Обработка слоя тайлов
     */
    processTileLayer(layer, level, tileWidth, tileHeight, tiledData) {
        const width = layer.width;
        const height = layer.height;
        
        // Получаем firstgid из tileset (обычно 1)
        const firstgid = tiledData.tilesets && tiledData.tilesets.length > 0 
            ? (tiledData.tilesets[0].firstgid || 1) 
            : 1;

        layer.data.forEach((tileIndex, index) => {
            if (tileIndex === 0 || tileIndex < firstgid) return; // Пустой тайл или меньше firstgid

            const x = (index % width) * tileWidth;
            const y = Math.floor(index / width) * tileHeight;
            
            // Вычисляем реальный ID тайла (вычитаем firstgid)
            const realTileId = tileIndex - firstgid;

            // Определение типа тайла по индексу
            // Значения: 2=платформа, 3=кирпич, 4=вопрос, 5=труба_верх, 6=труба_низ
            if (layer.name === 'platforms' || layer.name === 'ground') {
                // Все тайлы >= 2 считаем платформами
                if (tileIndex >= 2) {
                    level.platforms.push({
                        x: x,
                        y: y,
                        width: tileWidth,
                        height: tileHeight,
                        color: '#8B4513'
                    });
                }
            } else if (layer.name === 'obstacles') {
                level.obstacles.push({
                    x: x,
                    y: y,
                    width: tileWidth,
                    height: tileHeight,
                    color: '#FF0000'
                });
            }
        });
    }

    /**
     * Обработка слоя объектов
     */
    processObjectLayer(layer, level, tileWidth, tileHeight) {
        layer.objects.forEach(obj => {
            if (obj.type === 'player' || obj.name === 'player' || (obj.name && obj.name.startsWith('player'))) {
                level.playerStartX = obj.x;
                level.playerStartY = obj.y;
            } else if (obj.type === 'enemy' || (obj.name && obj.name.startsWith('enemy'))) {
                const enemyType = obj.properties?.find(p => p.name === 'type')?.value || 'patrol';
                const characterType = obj.properties?.find(p => p.name === 'characterType')?.value || 'Samurai';
                const health = parseInt(obj.properties?.find(p => p.name === 'health')?.value || '2', 10);
                level.enemies.push(new Enemy(
                    obj.x,
                    obj.y,
                    this.gameManager,
                    enemyType,
                    characterType,
                    health
                ));
            } else if (obj.type === 'bonus' || (obj.name && obj.name.startsWith('bonus'))) {
                const bonusType = obj.properties?.find(p => p.name === 'type')?.value || 'coin';
                // ОТЛАДКА: Выводим исходные координаты из Tiled
                console.log('Creating bonus from Tiled:', {
                    name: obj.name,
                    type: bonusType,
                    x: obj.x,
                    y: obj.y,
                    width: obj.width,
                    height: obj.height,
                    rawObj: obj
                });
                // В Tiled координата Y задает нижний край объекта
                // Преобразуем в верхний край при создании бонуса
                const bonusHeight = obj.height || 32;
                level.bonuses.push(new Bonus(obj.x, obj.y - bonusHeight, bonusType));
            } else if (obj.type === 'endpoint' || obj.name === 'endpoint') {
                level.endPoint = {
                    x: obj.x,
                    y: obj.y,
                    width: obj.width || 80,
                    height: obj.height || 100
                };
            } else if (obj.type === 'spike' || obj.name === 'spike' || (obj.name && obj.name.startsWith('spike'))) {
                // Обработка шипов
                // В Tiled координата Y задает нижний край объекта, в игре - верхний край
                const spikeHeight = obj.height || 32;
                level.spikes.push({
                    x: obj.x,
                    y: obj.y - spikeHeight, // Преобразуем координаты
                    width: obj.width || 32,
                    height: spikeHeight
                });
            }
        });
    }

    /**
     * Загрузить уровень по номеру
     * @param {number} levelNumber - Номер уровня (начиная с 1)
     */
    loadLevel(levelNumber) {
        const index = levelNumber - 1;
        if (index >= 0 && index < this.levels.length) {
            this.currentLevelData = this.levels[index];
            return this.currentLevelData;
        }
        return null;
    }

    /**
     * Получить данные текущего уровня
     */
    getLevel(levelNumber) {
        const index = levelNumber - 1;
        if (index >= 0 && index < this.levels.length) {
            return this.levels[index];
        }
        return null;
    }

    /**
     * Загрузить уровень из файла Tiled JSON
     * @param {string} url - URL файла уровня
     */
    async loadLevelFromFile(url) {
        try {
            const response = await fetch(url);
            const tiledData = await response.json();
            return this.loadFromTiled(tiledData);
        } catch (error) {
            console.error('Ошибка загрузки уровня:', error);
            return null;
        }
    }
}

