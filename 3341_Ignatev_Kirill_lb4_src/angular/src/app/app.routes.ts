import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { FeedComponent } from './components/feed/feed.component';
import { AddNewsComponent } from './components/add-news/add-news.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/feed', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'feed', component: FeedComponent, canActivate: [AuthGuard] },
  { path: 'add-news', component: AddNewsComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/feed' }
];

