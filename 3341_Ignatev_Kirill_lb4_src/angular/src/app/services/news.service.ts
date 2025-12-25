import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';

export interface News {
  id: number;
  authorId: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly API_BASE = 'https://localhost:3443/api';
  
  // Signal для списка новостей
  newsSignal = signal<News[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * Получить все новости (с опциональной фильтрацией по пользователю)
   */
  getNews(userId?: number): Observable<{ news: News[] }> {
    const url = userId 
      ? `${this.API_BASE}/news?userId=${userId}`
      : `${this.API_BASE}/news`;
    
    return this.http.get<{ news: News[] }>(url).pipe(
      tap(response => {
        this.newsSignal.set(response.news);
      })
    );
  }

  /**
   * Получить новости друзей и свои новости текущего пользователя
   */
  getFriendsNews(userId: number): Observable<{ news: News[] }> {
    // Сначала получаем список друзей, затем новости
    return this.http.get<{ friends: number[] }>(`${this.API_BASE}/friends/${userId}`).pipe(
      switchMap(friendsResponse => {
        const friendIds = friendsResponse.friends;
        // Включаем свои новости и новости друзей
        const userIdsToShow = [userId, ...friendIds];
        
        // Получаем все новости и фильтруем на клиенте
        return this.http.get<{ news: News[] }>(`${this.API_BASE}/news`).pipe(
          map(response => {
            // Фильтруем только активные новости от себя и друзей
            const friendsNews = response.news.filter(n => 
              userIdsToShow.includes(n.authorId) && n.isActive
            );
            return { news: friendsNews };
          })
        );
      }),
      tap(response => {
        this.newsSignal.set(response.news);
      })
    );
  }

  /**
   * Создать новую новость
   */
  createNews(news: Partial<News>): Observable<News> {
    return this.http.post<News>(`${this.API_BASE}/news`, news).pipe(
      tap(newNews => {
        // Добавляем новую новость в начало списка
        const currentNews = this.newsSignal();
        this.newsSignal.set([newNews, ...currentNews]);
      })
    );
  }

  /**
   * Переключить статус новости (блокировать/активировать)
   */
  toggleNewsStatus(newsId: number): Observable<News> {
    return this.http.patch<News>(`${this.API_BASE}/news/${newsId}/toggle`, {}).pipe(
      tap(updatedNews => {
        // Обновляем новость в списке
        const currentNews = this.newsSignal();
        const index = currentNews.findIndex(n => n.id === newsId);
        if (index !== -1) {
          currentNews[index] = updatedNews;
          this.newsSignal.set([...currentNews]);
        }
      })
    );
  }
}

