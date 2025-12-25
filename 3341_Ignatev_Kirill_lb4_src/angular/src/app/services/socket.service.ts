import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly API_BASE = 'https://localhost:3443';

  /**
   * Подключиться к WebSocket серверу
   */
  connect(): void {
    if (!this.socket) {
      this.socket = io(this.API_BASE, {
        transports: ['websocket'],
        rejectUnauthorized: false // Для self-signed сертификата
      });
    }
  }

  /**
   * Отключиться от WebSocket сервера
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Подписаться на событие новой новости
   */
  onNewNews(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('newNews', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('newNews');
        }
      };
    });
  }

  /**
   * Подписаться на событие обновления новости
   */
  onNewsUpdate(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('newsUpdate', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('newsUpdate');
        }
      };
    });
  }

  /**
   * Отправить событие
   */
  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

