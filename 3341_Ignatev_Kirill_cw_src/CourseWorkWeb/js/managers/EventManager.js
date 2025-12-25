/**
 * Менеджер событий
 * Управляет подпиской и распространением событий в игре
 */
export class EventManager {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Подписаться на событие
     * @param {string} eventType - Тип события
     * @param {Function} callback - Функция-обработчик
     */
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    /**
     * Отписаться от события
     * @param {string} eventType - Тип события
     * @param {Function} callback - Функция-обработчик для удаления
     */
    off(eventType, callback) {
        if (!this.listeners.has(eventType)) return;
        
        const callbacks = this.listeners.get(eventType);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Вызвать событие
     * @param {string} eventType - Тип события
     * @param {*} data - Данные события
     */
    emit(eventType, data = null) {
        if (!this.listeners.has(eventType)) return;
        
        const callbacks = this.listeners.get(eventType);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Ошибка в обработчике события ${eventType}:`, error);
            }
        });
    }

    /**
     * Очистить все подписки
     */
    clear() {
        this.listeners.clear();
    }
}







