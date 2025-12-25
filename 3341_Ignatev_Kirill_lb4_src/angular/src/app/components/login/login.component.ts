import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Вход в социальную сеть</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email обязателен
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Введите корректный email
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Пароль</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" required>
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Пароль обязателен
              </mat-error>
            </mat-form-field>

            <div *ngIf="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <button mat-raised-button color="primary" type="submit" [disabled]="loginForm.invalid || isSubmitting" class="full-width">
              {{ isSubmitting ? 'Вход...' : 'Войти' }}
            </button>

            <div class="register-link">
              <p>Нет аккаунта? <a [routerLink]="['/register']">Зарегистрироваться</a></p>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      padding: 20px;
    }
    mat-card {
      max-width: 400px;
      width: 100%;
    }
    .full-width {
      width: 100%;
      margin-bottom: 10px;
    }
    .error-message {
      color: #f44336;
      margin-bottom: 15px;
      padding: 10px;
      background-color: #ffebee;
      border-radius: 4px;
    }
    .register-link {
      text-align: center;
      margin-top: 20px;
    }
    .register-link a {
      color: #3f51b5;
      text-decoration: none;
    }
    .register-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;
  hidePassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (user) => {
          if (user) {
            this.router.navigate(['/feed']);
          } else {
            this.errorMessage = 'Неверный email или пароль';
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.errorMessage = 'Ошибка входа. Попробуйте еще раз.';
          this.isSubmitting = false;
        }
      });
    }
  }
}

