import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthSessionService } from './auth-session.service';

export const guestGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  session.restore();

  return session.statusChanges.pipe(
    filter((status) => status !== 'restoring'),
    take(1),
    map((status) => status === 'authenticated' ? router.createUrlTree(['/']) : true),
  );
};
