import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, User } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-toolbar color="primary">
      <span>Социальная сеть</span>
      <span class="spacer"></span>
      <ng-container *ngIf="authService.currentUser(); else notLoggedIn">
        <button mat-button [routerLink]="['/feed']">
          <mat-icon>home</mat-icon>
          Лента новостей
        </button>
        <button mat-button [routerLink]="['/add-news']">
          <mat-icon>add</mat-icon>
          Добавить новость
        </button>
        <button mat-button *ngIf="authService.isAdmin()" (click)="openAdminPanel()">
          <mat-icon>admin_panel_settings</mat-icon>
          Администрирование
        </button>
        <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-menu-button">
          <img [src]="getUserPhoto()" [alt]="getUserName()" class="user-avatar">
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="user-menu-header">
            <img [src]="getUserPhoto()" [alt]="getUserName()" class="user-menu-avatar">
            <div class="user-menu-info">
              <div class="user-menu-name">{{ getUserName() }}</div>
              <div class="user-menu-email">{{ authService.currentUser()?.email }}</div>
            </div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Выйти</span>
          </button>
        </mat-menu>
      </ng-container>
      <ng-template #notLoggedIn>
        <button mat-button [routerLink]="['/login']">
          <mat-icon>login</mat-icon>
          Вход
        </button>
        <button mat-button [routerLink]="['/register']">
          <mat-icon>person_add</mat-icon>
          Регистрация
        </button>
      </ng-template>
    </mat-toolbar>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    main {
      padding: 20px;
    }
    .user-menu-button {
      margin-left: 10px;
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }
    .user-menu-header {
      display: flex;
      align-items: center;
      padding: 16px;
      gap: 12px;
    }
    .user-menu-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
    .user-menu-info {
      flex: 1;
    }
    .user-menu-name {
      font-weight: 500;
      font-size: 14px;
    }
    .user-menu-email {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 4px;
    }
  `]
})
export class AppComponent {
  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }

  openAdminPanel() {
    window.open('/', '_blank');
  }

  getUserName(): string {
    const user = this.authService.currentUser();
    if (user) {
      return `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim();
    }
    return '';
  }

  getUserPhoto(): string {
    const user = this.authService.currentUser();
    return user?.photo || 'https://ui-avatars.com/api/?size=32&background=0d6efd&color=fff&name=' + encodeURIComponent(this.getUserName());
  }
}

