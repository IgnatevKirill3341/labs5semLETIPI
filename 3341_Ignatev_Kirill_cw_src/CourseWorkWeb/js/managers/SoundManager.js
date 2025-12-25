/**
 * Менеджер звука
 * Управляет воспроизведением звуковых эффектов и музыки
 */
export class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.audioBuffers = new Map(); // Кеш для загруженных аудиофайлов
        this.music = null; // HTML5 Audio элемент для фоновой музыки (текущая)
        this.musicTracks = new Map(); // Хранилище всех музыкальных треков
        this.musicVolume = 0.5;
        this.soundVolume = 0.7;
        this.enabled = true;
        this.audioContext = null; // AudioContext для воспроизведения файлов
        this.loadSounds();
    }

    /**
     * Загрузка звуковых файлов
     */
    loadSounds() {
        // Создаем звуки программно (в реальном проекте можно загружать файлы)
        // Для демонстрации используем Web Audio API для генерации звуков
        this.createSound('jump', this.generateJumpSound.bind(this));
        this.createSound('collect', this.generateCollectSound.bind(this));
        this.createSound('enemy', this.generateEnemySound.bind(this));
        this.createSound('gameover', this.generateGameOverSound.bind(this));
        this.createSound('levelup', this.generateLevelUpSound.bind(this));
        
        // Загружаем звуки из файлов
        this.loadAudioFile('attack', 'assets/Sounds/attack.mp3');
        this.loadAudioFile('death', 'assets/Sounds/death.mp3');
        
        // Загружаем фоновую музыку для главного меню
        this.loadMusic('main_theme', 'assets/Sounds/main_theme.mp3');
        
        // Загружаем музыку победы
        this.loadMusic('victory', 'assets/Sounds/victory.mp3');
        
        // Загружаем музыку поражения
        this.loadMusic('gameover', 'assets/Sounds/gameover.mp3');
        
        // Загружаем музыку игрового процесса (на 50% тише)
        this.loadMusic('gameprocess', 'assets/Sounds/gameprocess.mp3', this.musicVolume * 0.5);
    }

    /**
     * Создание звука через Web Audio API
     */
    createSound(name, generator) {
        // Не создаем AudioContext здесь, так как он требует пользовательского взаимодействия
        // Создадим его при первом воспроизведении
        const sound = {
            generator: generator
        };
        this.sounds.set(name, sound);
    }

    /**
     * Генерация звука прыжка
     */
    generateJumpSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.value = 400;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.2);
        } catch (error) {
            console.warn('Не удалось воспроизвести звук:', error);
        }
    }

    /**
     * Генерация звука сбора бонуса
     */
    generateCollectSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
        } catch (error) {
            console.warn('Не удалось воспроизвести звук:', error);
        }
    }

    /**
     * Генерация звука врага
     */
    generateEnemySound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } catch (error) {
            console.warn('Не удалось воспроизвести звук:', error);
        }
    }

    /**
     * Генерация звука окончания игры
     */
    generateGameOverSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const frequencies = [200, 150, 100];
            
            frequencies.forEach((freq, index) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                const startTime = ctx.currentTime + index * 0.2;
                gainNode.gain.setValueAtTime(0.3, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.5);
            });
        } catch (error) {
            console.warn('Не удалось воспроизвести звук:', error);
        }
    }

    /**
     * Генерация звука повышения уровня
     */
    generateLevelUpSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const frequencies = [400, 500, 600, 700];
            
            frequencies.forEach((freq, index) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                const startTime = ctx.currentTime + index * 0.1;
                gainNode.gain.setValueAtTime(0.2, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.2);
            });
        } catch (error) {
            console.warn('Не удалось воспроизвести звук:', error);
        }
    }

    /**
     * Загрузка аудиофайла
     * @param {string} name - Имя звука
     * @param {string} path - Путь к файлу
     */
    async loadAudioFile(name, path) {
        try {
            const response = await fetch(path);
            const arrayBuffer = await response.arrayBuffer();
            
            // Создаем AudioContext при первой загрузке
            if (!this.audioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            }
            
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(name, audioBuffer);
            
            // Создаем обертку для воспроизведения
            this.createSound(name, () => this.playAudioFile(name));
        } catch (error) {
            console.warn(`Не удалось загрузить аудиофайл ${path}:`, error);
        }
    }

    /**
     * Воспроизведение загруженного аудиофайла
     * @param {string} name - Имя звука
     */
    playAudioFile(name) {
        if (!this.enabled) return;
        
        const audioBuffer = this.audioBuffers.get(name);
        if (!audioBuffer) {
            console.warn(`Аудиофайл ${name} не загружен`);
            return;
        }
        
        try {
            // Создаем AudioContext, если его еще нет
            if (!this.audioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            }
            
            // Восстанавливаем контекст, если он был приостановлен
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = audioBuffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.value = this.soundVolume;
            
            source.start(0);
        } catch (error) {
            console.warn(`Не удалось воспроизвести аудиофайл ${name}:`, error);
        }
    }

    /**
     * Воспроизвести звуковой эффект
     * @param {string} soundName - Имя звука
     */
    playSound(soundName) {
        if (!this.enabled) return;
        
        // Сначала проверяем, есть ли загруженный аудиофайл
        if (this.audioBuffers.has(soundName)) {
            this.playAudioFile(soundName);
            return;
        }
        
        // Иначе используем генератор звука
        const sound = this.sounds.get(soundName);
        if (sound && sound.generator) {
            try {
                sound.generator();
            } catch (error) {
                console.warn(`Не удалось воспроизвести звук ${soundName}:`, error);
            }
        }
    }

    /**
     * Включить/выключить звук
     */
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            // Останавливаем музыку при выключении звука
            this.stopMusic();
        } else {
            // Если звук включен и мы в меню, можно попробовать воспроизвести музыку
            // Но лучше делать это вручную из GameManager при показе меню
        }
        return this.enabled;
    }

    /**
     * Установить громкость звуковых эффектов
     * @param {number} volume - Громкость (0-1)
     */
    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Установить громкость музыки
     * @param {number} volume - Громкость (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        // Обновляем громкость для всех треков
        this.musicTracks.forEach((audio, name) => {
            // gameprocess играет на 50% тише
            if (name === 'gameprocess') {
                audio.volume = this.musicVolume * 0.5;
            } else {
                audio.volume = this.musicVolume;
            }
        });
        
        // Также обновляем текущий трек для обратной совместимости
        if (this.music) {
            if (this.music === this.musicTracks.get('gameprocess')) {
                this.music.volume = this.musicVolume * 0.5;
            } else {
                this.music.volume = this.musicVolume;
            }
        }
    }

    /**
     * Загрузка фоновой музыки
     * @param {string} name - Имя трека
     * @param {string} path - Путь к музыкальному файлу
     * @param {number} volume - Громкость (0-1, опционально, по умолчанию использует musicVolume)
     */
    loadMusic(name, path, volume = null) {
        try {
            const audio = new Audio(path);
            audio.volume = volume !== null ? volume : this.musicVolume;
            audio.loop = true; // Зацикливаем музыку
            audio.preload = 'auto';
            this.musicTracks.set(name, audio);
            
            // Если это первый трек, делаем его текущим (для обратной совместимости)
            if (!this.music) {
                this.music = audio;
            }
        } catch (error) {
            console.warn(`Не удалось загрузить музыку ${name} (${path}):`, error);
        }
    }

    /**
     * Воспроизвести фоновую музыку
     * @param {string} name - Имя трека (опционально, по умолчанию играет текущий)
     */
    playMusic(name = null) {
        if (!this.enabled) return;
        
        // Останавливаем текущую музыку
        this.stopMusic();
        
        // Определяем, какой трек играть
        let musicToPlay = this.music;
        if (name && this.musicTracks.has(name)) {
            musicToPlay = this.musicTracks.get(name);
            this.music = musicToPlay; // Обновляем текущий трек
        }
        
        if (!musicToPlay) return;
        
        try {
            // Попытка воспроизведения может быть заблокирована браузером до пользовательского взаимодействия
            const playPromise = musicToPlay.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Автовоспроизведение может быть заблокировано браузером
                    console.warn('Автовоспроизведение музыки заблокировано:', error);
                });
            }
        } catch (error) {
            console.warn('Не удалось воспроизвести музыку:', error);
        }
    }

    /**
     * Остановить фоновую музыку
     */
    stopMusic() {
        // Останавливаем все музыкальные треки
        this.musicTracks.forEach((audio) => {
            try {
                audio.pause();
                audio.currentTime = 0; // Сбрасываем на начало
            } catch (error) {
                console.warn('Не удалось остановить музыку:', error);
            }
        });
        
        // Также останавливаем текущий трек для обратной совместимости
        if (this.music) {
            try {
                this.music.pause();
                this.music.currentTime = 0;
            } catch (error) {
                console.warn('Не удалось остановить текущую музыку:', error);
            }
        }
    }
}
