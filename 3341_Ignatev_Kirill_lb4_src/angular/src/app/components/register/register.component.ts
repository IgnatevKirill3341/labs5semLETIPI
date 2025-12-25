import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatIconModule,
    RouterLink
  ],
  template: `
    <div class="register-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Регистрация в социальной сети</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Имя</mat-label>
              <input matInput formControlName="firstName" required>
              <mat-error *ngIf="registerForm.get('firstName')?.hasError('required')">
                Имя обязательно
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Фамилия</mat-label>
              <input matInput formControlName="lastName" required>
              <mat-error *ngIf="registerForm.get('lastName')?.hasError('required')">
                Фамилия обязательна
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Отчество</mat-label>
              <input matInput formControlName="middleName">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Дата рождения</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="dateOfBirth" required>
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              <mat-error *ngIf="registerForm.get('dateOfBirth')?.hasError('required')">
                Дата рождения обязательна
              </mat-error>
              <mat-error *ngIf="registerForm.get('dateOfBirth')?.hasError('age')">
                Вам должно быть больше 18 лет
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                Email обязателен
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
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
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                Пароль обязателен
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                Пароль должен содержать минимум 6 символов
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Подтвердите пароль</mat-label>
              <input matInput [type]="hidePasswordConfirm ? 'password' : 'text'" formControlName="confirmPassword" required>
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix (click)="hidePasswordConfirm = !hidePasswordConfirm" type="button">
                <mat-icon>{{ hidePasswordConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
                Подтверждение пароля обязательно
              </mat-error>
              <mat-error *ngIf="registerForm.hasError('passwordMismatch')">
                Пароли не совпадают
              </mat-error>
            </mat-form-field>

            <div class="login-link">
              <p>Уже есть аккаунт? <a [routerLink]="['/login']">Войти</a></p>
            </div>

            <button mat-raised-button color="primary" type="submit" [disabled]="registerForm.invalid || isSubmitting" class="full-width">
              {{ isSubmitting ? 'Регистрация...' : 'Зарегистрироваться' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      padding: 20px;
    }
    mat-card {
      max-width: 500px;
      width: 100%;
    }
    .full-width {
      width: 100%;
      margin-bottom: 10px;
    }
    .login-link {
      text-align: center;
      margin-top: 15px;
    }
    .login-link a {
      color: #3f51b5;
      text-decoration: none;
    }
    .login-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isSubmitting = false;
  hidePassword = true;
  hidePasswordConfirm = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      middleName: [''],
      dateOfBirth: ['', [Validators.required, this.ageValidator]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Валидатор возраста (18+)
   */
  ageValidator(control: any) {
    if (!control.value) return null;
    
    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 18 ? null : { age: true };
  }

  /**
   * Валидатор совпадения паролей
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isSubmitting = true;
      const formValue = this.registerForm.value;
      
      // Форматирование даты для API
      const dateOfBirth = formValue.dateOfBirth instanceof Date
        ? formValue.dateOfBirth.toISOString().split('T')[0]
        : formValue.dateOfBirth;

      const userData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        middleName: formValue.middleName,
        dateOfBirth,
        email: formValue.email,
        password: formValue.password, // Пароль будет захеширован на сервере
        role: 'user' as const, // Все новые пользователи регистрируются как обычные пользователи
        status: 'active' as const
      };

      this.authService.register(userData).subscribe({
        next: (user) => {
          // После регистрации автоматически входим
          this.authService.login(userData.email, userData.password).subscribe({
            next: (loggedInUser) => {
              if (loggedInUser) {
                this.router.navigate(['/feed']);
              } else {
                // Если автоматический вход не удался, перенаправляем на страницу входа
                this.router.navigate(['/login']);
              }
            },
            error: () => {
              // Если автоматический вход не удался, перенаправляем на страницу входа
              this.router.navigate(['/login']);
            }
          });
        },
        error: (error) => {
          console.error('Registration error:', error);
          const errorMessage = error.error?.error || 'Ошибка регистрации. Попробуйте еще раз.';
          alert(errorMessage);
          this.isSubmitting = false;
        }
      });
    }
  }
}

