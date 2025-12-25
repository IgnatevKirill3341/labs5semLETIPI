import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password?: string; // Хешированный пароль (не отправляется на клиент)
  photo?: string;
  role: 'admin' | 'user';
  status: 'active' | 'unconfirmed' | 'blocked';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE = 'https://localhost:3443/api';
  private readonly STORAGE_KEY = 'currentUser';

  // Signal для текущего пользователя
  private currentUserSignal = signal<User | null>(this.loadUserFromStorage());
  
  // Computed signal для проверки авторизации
  isAuthenticated = computed(() => this.currentUserSignal() !== null);
  
  // Computed signal для проверки роли администратора
  isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Получить текущего пользователя
   */
  currentUser(): User | null {
    return this.currentUserSignal();
  }

  /**
   * Регистрация нового пользователя
   */
  register(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.API_BASE}/users`, userData).pipe(
      tap(user => {
        this.setCurrentUser(user);
      }),
      catchError(error => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }

  /**
   * Вход пользователя по email и паролю
   */
  login(email: string, password: string): Observable<User | null> {
    return this.http.post<{ user: User | null }>(`${this.API_BASE}/auth/login`, { email, password }).pipe(
      map(response => {
        if (response.user) {
          this.setCurrentUser(response.user);
          return response.user;
        }
        return null;
      }),
      catchError(error => {
        console.error('Login error:', error);
        return of(null);
      })
    );
  }

  /**
   * Выход пользователя
   */
  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  /**
   * Обновить фото пользователя
   */
  updatePhoto(userId: number, photoUrl: string): Observable<User> {
    return this.http.put<User>(`${this.API_BASE}/users/${userId}`, { photo: photoUrl }).pipe(
      tap(user => {
        this.setCurrentUser(user);
      })
    );
  }

  /**
   * Установить текущего пользователя
   */
  private setCurrentUser(user: User): void {
    this.currentUserSignal.set(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Загрузить пользователя из localStorage
   */
  private loadUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem(this.STORAGE_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
}

