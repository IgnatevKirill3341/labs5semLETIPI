/**
 * Менеджер спрайтов
 * Управляет загрузкой и кешированием спрайтов
 */
export class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Загрузить спрайт
     * @param {string} path - Путь к спрайту
     * @returns {Promise<HTMLImageElement>}
     */
    async loadSprite(path) {
        // Проверяем кеш
        if (this.sprites.has(path)) {
            return this.sprites.get(path);
        }

        // Проверяем, не загружается ли уже
        if (this.loadingPromises.has(path)) {
            return this.loadingPromises.get(path);
        }

        // Загружаем новый спрайт
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites.set(path, img);
                this.loadingPromises.delete(path);
                resolve(img);
            };
            img.onerror = () => {
                this.loadingPromises.delete(path);
                console.error(`Ошибка загрузки спрайта: ${path}`);
                reject(new Error(`Не удалось загрузить спрайт: ${path}`));
            };
            img.src = path;
        });

        this.loadingPromises.set(path, promise);
        return promise;
    }

    /**
     * Загрузить все спрайты для персонажа
     * @param {string} characterType - Тип персонажа ('Samurai_Commander' или 'Samurai')
     * @returns {Promise<Object>} Объект со всеми спрайтами и их метаданными
     */
    async loadCharacterSprites(characterType) {
        const spritePaths = {
            idle: `assets/${characterType}/Idle.png`,
            run: `assets/${characterType}/Run.png`,
            walk: `assets/${characterType}/Walk.png`,
            jump: `assets/${characterType}/Jump.png`,
            attack1: `assets/${characterType}/Attack_1.png`,
            attack2: `assets/${characterType}/Attack_2.png`,
            attack3: `assets/${characterType}/Attack_3.png`,
            hurt: `assets/${characterType}/Hurt.png`,
            dead: `assets/${characterType}/Dead.png`,
            protect: `assets/${characterType}/${characterType === 'Samurai_Commander' ? 'Protect' : 'Protection'}.png`
        };

        const sprites = {};
        const loadPromises = [];

        for (const [key, path] of Object.entries(spritePaths)) {
            loadPromises.push(
                this.loadSprite(path).then(img => {
                    // Автоматическое определение размера кадра
                    // Предполагаем, что высота изображения = высота кадра
                    const frameHeight = img.height;
                    // Предполагаем квадратные кадры или стандартный размер
                    const frameWidth = frameHeight || 64;
                    // Количество кадров определяется по ширине изображения
                    const frameCount = Math.max(1, Math.floor(img.width / frameWidth));
                    
                    // Создаем объект с изображением и метаданными для sprite sheet
                    sprites[key] = {
                        image: img,
                        frameWidth: frameWidth,
                        frameHeight: frameHeight,
                        frameCount: frameCount,
                        frameDuration: key.includes('attack') ? 100 : 150 // Длительность кадра в мс
                    };
                    
                    console.log(`Загружен спрайт ${key}: ${img.width}x${img.height}, кадров: ${frameCount}, размер кадра: ${frameWidth}x${frameHeight}`);
                }).catch(() => {
                    // Если спрайт не найден, создаем заглушку
                    console.warn(`Спрайт не найден: ${path}, используется заглушка`);
                    sprites[key] = {
                        image: this.createPlaceholder(64, 64),
                        frameWidth: 64,
                        frameHeight: 64,
                        frameCount: 1,
                        frameDuration: 150
                    };
                })
            );
        }

        await Promise.all(loadPromises);
        return sprites;
    }

    /**
     * Создать заглушку для отсутствующего спрайта
     */
    createPlaceholder(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FF00FF';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('?', width / 2, height / 2);
        return canvas;
    }

    /**
     * Получить спрайт из кеша
     */
    getSprite(path) {
        return this.sprites.get(path);
    }
}

