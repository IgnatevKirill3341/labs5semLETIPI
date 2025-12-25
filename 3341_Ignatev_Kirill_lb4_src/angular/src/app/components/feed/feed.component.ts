import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { NewsService, News } from '../../services/news.service';
import { UserService } from '../../services/user.service';
import { SocketService } from '../../services/socket.service';
import { SoundService } from '../../services/sound.service';
import { Subscription } from 'rxjs';
import { NewsItemDirective } from '../../directives/news-item.directive';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    NewsItemDirective
  ],
  template: `
    <div class="feed-container">
      <h1>Лента новостей</h1>
      
      <div *ngIf="isLoading" class="loading">
        <mat-spinner></mat-spinner>
      </div>

      <div *ngIf="!isLoading && news().length === 0" class="empty-state">
        <mat-icon>article</mat-icon>
        <p>Новостей пока нет</p>
      </div>

      <div class="news-list">
        <mat-card 
          *ngFor="let newsItem of news(); trackBy: trackByNewsId" 
          class="news-card"
          appNewsItem
          [news]="newsItem">
          <mat-card-header>
            <div class="author-info">
              <img [src]="getAuthorPhoto(newsItem.authorId)" [alt]="getAuthorName(newsItem.authorId)" class="author-photo">
              <div>
                <mat-card-title>{{ getAuthorName(newsItem.authorId) }}</mat-card-title>
                <mat-card-subtitle>{{ formatDate(newsItem.createdAt) }}</mat-card-subtitle>
              </div>
            </div>
            <mat-chip [color]="newsItem.isActive ? 'primary' : 'warn'">
              {{ newsItem.isActive ? 'Активна' : 'Заблокирована' }}
            </mat-chip>
          </mat-card-header>
          <mat-card-content>
            <h3>{{ newsItem.title }}</h3>
            <p>{{ newsItem.content }}</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .feed-container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      margin-bottom: 20px;
    }
    .loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 20px;
    }
    .news-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .news-card {
      transition: transform 0.2s;
    }
    .author-info {
      display: flex;
      align-items: center;
      gap: 15px;
      flex: 1;
    }
    .author-photo {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }
    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `]
})
export class FeedComponent implements OnInit, OnDestroy {
  news = signal<News[]>([]);
  users = signal<any[]>([]);
  isLoading = true;
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private newsService: NewsService,
    private userService: UserService,
    private socketService: SocketService,
    private soundService: SoundService
  ) {}

  ngOnInit() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return;
    }

    // Подключение к WebSocket
    this.socketService.connect();

    // Загрузка пользователей
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users.set(response.users);
      }
    });

    // Загрузка всех новостей
    this.loadAllNews();

    // Подписка на новые новости через WebSocket
    this.subscriptions.add(
      this.socketService.onNewNews().subscribe((newNews: News) => {
        // Добавляем новость только если она активна
        if (newNews.isActive) {
          const currentNews = this.news();
          this.news.set([newNews, ...currentNews]);
          this.soundService.playNewsSound();
        }
      })
    );

    // Подписка на обновления новостей
    this.subscriptions.add(
      this.socketService.onNewsUpdate().subscribe((updatedNews: News) => {
        const currentNews = this.news();
        const index = currentNews.findIndex(n => n.id === updatedNews.id);
        if (index !== -1) {
          currentNews[index] = updatedNews;
          this.news.set([...currentNews]);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.socketService.disconnect();
  }

  loadAllNews() {
    this.isLoading = true;
    this.newsService.getNews().subscribe({
      next: () => {
        // Фильтруем только активные новости
        const allNews = this.newsService.newsSignal();
        const activeNews = allNews.filter(n => n.isActive);
        this.news.set(activeNews);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading news:', error);
        this.isLoading = false;
      }
    });
  }

  getAuthorName(authorId: number): string {
    const user = this.users().find(u => u.id === authorId);
    if (user) {
      return `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim();
    }
    return 'Неизвестный пользователь';
  }

  getAuthorPhoto(authorId: number): string {
    const user = this.users().find(u => u.id === authorId);
    return user?.photo || 'https://ui-avatars.com/api/?size=50&background=0d6efd&color=fff';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  }

  trackByNewsId(index: number, news: News): number {
    return news.id;
  }
}

