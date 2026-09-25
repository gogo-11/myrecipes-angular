import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthSessionService } from './auth/auth-session.service';

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  constructor() {
    this.session.restore();
  }

  protected logout(): void {
    this.session.logout();
    void this.router.navigateByUrl('/');
  }
}
