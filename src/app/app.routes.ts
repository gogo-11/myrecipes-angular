import { Routes } from '@angular/router';
import { guestGuard } from './auth/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./recipes/recipe-list/recipe-list').then((module) => module.RecipeList),
  },
  {
    path: 'recipes/:id',
    loadComponent: () => import('./recipes/recipe-details/recipe-details').then((module) => module.RecipeDetails),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login').then((module) => module.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/register/register').then((module) => module.Register),
  },
  {
    path: 'check-email',
    loadComponent: () => import('./auth/check-email/check-email').then((module) => module.CheckEmail),
  },
  {
    path: 'confirm-email/:token',
    loadComponent: () => import('./auth/confirm-email/confirm-email').then((module) => module.ConfirmEmail),
  },
  {
    path: 'resend-confirmation',
    loadComponent: () => import('./auth/resend-confirmation/resend-confirmation').then((module) => module.ResendConfirmation),
  },
];
