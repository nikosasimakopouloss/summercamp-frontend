import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserService } from '../services/user.service';

export const adminRoleGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (userService.isLoggedIn() && userService.isAdmin()) {
    return true;
  }

  // Redirect to dashboard if not admin
  router.navigate(['/dashboard']);
  return false;
};