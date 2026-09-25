import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-check-email',
  imports: [RouterLink],
  templateUrl: './check-email.html',
  styleUrl: './check-email.scss',
})
export class CheckEmail {
  protected readonly message = signal(this.registrationMessage());

  private registrationMessage(): string {
    const state: unknown = typeof history === 'undefined' ? null : history.state;
    if (typeof state === 'object' && state !== null && 'registrationMessage' in state
      && typeof state.registrationMessage === 'string') {
      return state.registrationMessage;
    }
    return 'Your account needs email confirmation before you can sign in.';
  }
}
