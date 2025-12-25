import { GameManager } from './managers/GameManager.js';
import { SoundManager } from './managers/SoundManager.js';
import { PhysicsManager } from './managers/PhysicsManager.js';
import { EventManager } from './managers/EventManager.js';

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализация игры...');
    try {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas элемент не найден!');
            return;
        }
        
        console.log('Canvas найден, настройка размеров...');
        canvas.width = 1024;
        canvas.height = 768;

        console.log('Создание GameManager...');
        const gameManager = new GameManager(canvas);
        console.log('GameManager создан, вызов init()...');
        gameManager.init();
        console.log('Инициализация завершена');
        
        // Запускаем видео меню, если меню активно при загрузке
        const menuVideo = document.getElementById('menu-video');
        if (menuVideo && document.getElementById('menu-screen').classList.contains('active')) {
            menuVideo.play().catch(err => {
                console.warn('Не удалось автоматически воспроизвести видео:', err);
            });
        }
        
        // Сохраняем gameManager в глобальной области для отладки
        window.gameManager = gameManager;
    } catch (error) {
        console.error('Ошибка инициализации игры:', error);
        console.error('Стек ошибки:', error.stack);
        alert('Произошла ошибка при загрузке игры. Проверьте консоль браузера для деталей.');
    }
});
