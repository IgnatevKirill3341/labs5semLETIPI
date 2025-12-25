import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { NewsService } from '../../services/news.service';
import { SocketService } from '../../services/socket.service';
import { SoundService } from '../../services/sound.service';

@Component({
  selector: 'app-add-news',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="add-news-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Добавить новость</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="newsForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Заголовок</mat-label>
              <input matInput formControlName="title" required>
              <mat-error *ngIf="newsForm.get('title')?.hasError('required')">
                Заголовок обязателен
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Содержание</mat-label>
              <textarea matInput formControlName="content" rows="5" required></textarea>
              <mat-error *ngIf="newsForm.get('content')?.hasError('required')">
                Содержание обязательно
              </mat-error>
            </mat-form-field>

            <div class="actions">
              <button mat-raised-button type="button" (click)="cancel()">
                Отмена
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="newsForm.invalid || isSubmitting">
                <mat-icon>send</mat-icon>
                {{ isSubmitting ? 'Публикация...' : 'Опубликовать' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .add-news-container {
      max-width: 600px;
      margin: 0 auto;
    }
    .full-width {
      width: 100%;
      margin-bottom: 10px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `]
})
export class AddNewsComponent {
  newsForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private newsService: NewsService,
    private socketService: SocketService,
    private soundService: SoundService,
    private router: Router
  ) {
    this.newsForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.newsForm.valid) {
      this.isSubmitting = true;
      const currentUser = this.authService.currentUser();
      
      if (!currentUser) {
        this.router.navigate(['/register']);
        return;
      }

      const newsData = {
        ...this.newsForm.value,
        authorId: currentUser.id,
        isActive: true
      };

      this.newsService.createNews(newsData).subscribe({
        next: (news) => {
          // Отправляем событие через WebSocket
          this.socketService.emit('newNews', news);
          this.soundService.playNewsSound();
          this.router.navigate(['/feed']);
        },
        error: (error) => {
          console.error('Error creating news:', error);
          alert('Ошибка при публикации новости');
          this.isSubmitting = false;
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/feed']);
  }
}

