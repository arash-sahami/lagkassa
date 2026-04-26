import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Wait until Firebase has resolved the auth state (not undefined)
  return toObservable(auth.currentUser).pipe(
    filter(user => user !== undefined),
    take(1),
    map(user => user ? true : router.createUrlTree(['/login'])),
  );
};
