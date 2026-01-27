import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserService } from '../services/user.service';
import { jwtDecode } from 'jwt-decode';

export const adminRoleGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);



 console.log('🔒 Checking admin access for:', state.url);
  
  // Get token from localStorage
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    console.log('❌ No token found');
    router.navigate(['/login']);
    return false;
  }
  
  try {
    // Decode token to check roles
    const decoded = jwtDecode(token) as any;
    console.log('🔍 Token roles:', decoded.roles);
    
    // Check for admin role ID
    const ADMIN_ROLE_ID = '696baf403e5f117e0a9620e8';
    const hasAdminRole = decoded.roles?.includes(ADMIN_ROLE_ID);
    
    // Check if user is administrator
    const isAdministrator = 
      decoded.username?.toLowerCase() === 'administrator' ||
      decoded.email?.toLowerCase() === 'manolis@gmail.com';
    
    if (hasAdminRole || isAdministrator) {
      console.log('✅ Admin access granted');
      return true;
    }
    
  } catch (error) {
    console.error('Error checking token:', error);
  }
  
  // If token check fails, try UserService
  if (userService.isLoggedIn() && userService.isAdmin()) {
    console.log('✅ Admin access granted via UserService');
    return true;
  }





























  if (userService.isLoggedIn() && userService.isAdmin()) {
    return true;

  }



  // Redirect to dashboard if not admin
  router.navigate(['/dashboard']);
  return false;
};