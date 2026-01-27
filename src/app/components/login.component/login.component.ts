import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { jwtDecode } from 'jwt-decode'; // ✅ Add this import

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Shared Services
import { UserService } from "../../shared/services/user.service";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    // Material
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  
  userService = inject(UserService);
  
  loginForm: FormGroup;
  hidePassword = true;

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.userService.clearError();
    
    if (this.userService.isLoggedIn()) {
      // Check if user is admin and redirect accordingly
      if (this.userService.isAdmin()) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.userService.loginUser(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('✅ Login successful');
          console.log('👤 Response user:', response.user);
          console.log('🎭 Response user roles:', response.user.roles);
          
          // Set session
          this.userService.setSession(response);
          
          // Check if user is admin directly from response
          this.checkAndRedirect(response);
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Λάθος όνομα χρήστη ή κωδικός';
          this.userService.setError(errorMessage);
        }
      });
    }
  }

  private checkAndRedirect(response: any): void {
    // ADMIN role ID from your logs
    const ADMIN_ROLE_ID = '696baf403e5f117e0a9620e8';
    
    // Check 1: Look for ADMIN role in response user roles
    const hasAdminRoleInResponse = response.user.roles?.some((role: any) => {
      if (role && typeof role === 'object') {
        return role.role?.toUpperCase() === 'ADMIN' ||
               role.name?.toUpperCase() === 'ADMIN' ||
               role._id === ADMIN_ROLE_ID;
      }
      return false;
    });
    
    // Check 2: Check if this is the administrator user
    const isAdministratorUser = 
      response.user.username?.toLowerCase() === 'administrator' ||
      response.user.email?.toLowerCase() === 'manolis@gmail.com';
    
    // Check 3: Also check the JWT token directly
    let hasAdminRoleInToken = false;
    try {
      const decoded = jwtDecode(response.token) as any;
      hasAdminRoleInToken = decoded.roles?.includes(ADMIN_ROLE_ID);
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    
    console.log('👑 Admin checks:');
    console.log('   - Has admin role in response?', hasAdminRoleInResponse);
    console.log('   - Is administrator user?', isAdministratorUser);
    console.log('   - Has admin role in token?', hasAdminRoleInToken);
    
    // If ANY check passes, redirect to admin dashboard
    if (hasAdminRoleInResponse || isAdministratorUser || hasAdminRoleInToken) {
      console.log('📍 Redirecting to ADMIN dashboard');
      this.router.navigate(['/admin/dashboard']);
    } else {
      console.log('📍 Redirecting to regular user dashboard');
      this.router.navigate(['/dashboard']);
    }
  }
}