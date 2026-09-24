import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./recipes/recipe-list').then((module) => module.RecipeList),
  },
];
