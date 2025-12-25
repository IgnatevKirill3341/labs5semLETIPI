import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  photo?: string;
  role: 'admin' | 'user';
  status: 'active' | 'unconfirmed' | 'blocked';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_BASE = 'https://localhost:3443/api';

  constructor(private http: HttpClient) {}

  /**
   * Получить всех пользователей
   */
  getUsers(): Observable<{ users: User[] }> {
    return this.http.get<{ users: User[] }>(`${this.API_BASE}/users`);
  }

  /**
   * Получить пользователя по ID
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_BASE}/users/${id}`);
  }

  /**
   * Получить друзей пользователя
   */
  getFriends(userId: number): Observable<{ friends: number[] }> {
    return this.http.get<{ friends: number[] }>(`${this.API_BASE}/friends/${userId}`);
  }

  /**
   * Добавить друга
   */
  addFriend(userId1: number, userId2: number): Observable<any> {
    return this.http.post(`${this.API_BASE}/friends`, { userId1, userId2 });
  }

  /**
   * Удалить друга
   */
  removeFriend(userId1: number, userId2: number): Observable<any> {
    return this.http.delete(`${this.API_BASE}/friends/${userId1}/${userId2}`);
  }
}

