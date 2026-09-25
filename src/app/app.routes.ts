import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./recipes/recipe-list').then((module) => module.RecipeList),
  },
  {
    path: 'recipes/:id',
    loadComponent: () => import('./recipes/recipe-details').then((module) => module.RecipeDetails),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login').then((module) => module.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register').then((module) => module.Register),
  },
  {
    path: 'check-email',
    loadComponent: () => import('./auth/check-email').then((module) => module.CheckEmail),
  },
  {
    path: 'confirm-email/:token',
    loadComponent: () => import('./auth/confirm-email').then((module) => module.ConfirmEmail),
  },
  {
    path: 'resend-confirmation',
    loadComponent: () => import('./auth/resend-confirmation').then((module) => module.ResendConfirmation),
  },
];
