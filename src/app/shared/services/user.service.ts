import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment.development';
import { 
  ICredentials, 
  IUser, 
  ILoggedInUser,
  ILoginResponse,
  ICheckAmkaResponse 
} from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals
  user = signal<ILoggedInUser | null>(null);
  loading = signal<boolean>(false);
  error = signal<string>('');

  constructor() {
    const access_token = localStorage.getItem('access_token');
    if (access_token) {
      this.initializeUserFromToken(access_token);
    }
  }

  private initializeUserFromToken(token: string): void {
    try {
      const decodedToken = jwtDecode(token) as any;
      this.user.set({
        _id: decodedToken._id,
        username: decodedToken.username,
        email: decodedToken.email,
        firstname: decodedToken.firstname,
        lastname: decodedToken.lastname,
        roles: decodedToken.roles || []
      });
    } catch (error) {
      console.error('Invalid token:', error);
      this.logoutUser();
    }
  }

  // Authentication
  loginUser(credentials: ICredentials) {
    this.loading.set(true);
    this.error.set('');
    
    return this.http.post<ILoginResponse>(
      `${environment.apiUrl}/api/auth/login`, 
      credentials
    );
  }

  setSession(response: ILoginResponse): void {
    localStorage.setItem('access_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));




try {
    const decodedToken = jwtDecode(response.token) as any;
    console.log('🔍 Decoded JWT Token:', decodedToken);
    console.log('🔍 Token has roles?', decodedToken.roles);
    console.log('🔍 Full token payload:', JSON.stringify(decodedToken, null, 2));
  } catch (error) {
    console.error('Error decoding token:', error);
  }











    
    this.user.set({
      _id: response.user._id,
      username: response.user.username,
      email: response.user.email,
      firstname: response.user.firstname,
      lastname: response.user.lastname,
      roles: response.user.roles || []
    });
    
    this.loading.set(false);
  }

  logoutUser(): void {
    this.user.set(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  // User Management
  createUser(data: IUser) {
    this.loading.set(true);
    this.error.set('');
    
    return this.http.post<IUser>(
      `${environment.apiUrl}/api/users`, 
      data
    );
  }

  getUser(id: string) {
    return this.http.get<IUser>(`${environment.apiUrl}/api/users/${id}`);
  }

  updateUser(id: string, data: Partial<IUser>) {
    return this.http.put<IUser>(`${environment.apiUrl}/api/users/${id}`, data);
  }

  deleteUser(id: string) {
    return this.http.delete(`${environment.apiUrl}/api/users/${id}`);
  }

  // Admin Operations
  getAllUsers() {
    return this.http.get<IUser[]>(`${environment.apiUrl}/api/users`);
  }

  // Utility Methods
  isLoggedIn(): boolean {
    return !!this.user();
  }

  // isAdmin(): boolean {
  //   const user = this.user();
  //   return user?.roles?.includes('admin') || false;
  // }


// isAdmin(): boolean {
//   const user = this.user();

//  if (!user?.roles) return false;
  
//   // Handle both formats: array of role objects OR array of strings
//   return user.roles.some((role: any) => {
//     if (typeof role === 'string'     ) {
//       // Handle string format (deprecated but for backward compatibility)
//       return role.toUpperCase() === 'ADMIN';
//     } else if (role && typeof role === 'object') {
//       // Handle object format with 'role' property
//       return role.role?.toUpperCase() === 'ADMIN';
//     }
//     return false;
//   });
// }


isAdmin(): boolean {
  const user = this.user();
  
  // Admin role ID from your logs
  const ADMIN_ROLE_ID = '696baf403e5f117e0a9620e8';
  
  // Check if user has admin role ID
  if (user?.roles) {
    return user.roles.some((role: any) => {
      // If role is a string (the role ID)
      if (typeof role === 'string' && role === ADMIN_ROLE_ID) {
        return true;
      }
      
      // If role is an object with _id
      if (role && typeof role === 'object' && role._id === ADMIN_ROLE_ID) {
        return true;
      }
      
      // If role object has role/name property
      if (role && typeof role === 'object') {
        const roleName = role.role || role.name || '';
        return roleName.toUpperCase() === 'ADMIN';
      }


     




      
      return false;
    });
  }
  
  // Fallback: check by username/email
  const adminUsers = ['administrator', 'admin', 'manolis@gmail.com'];
  return adminUsers.some(admin => 
    user?.username?.toLowerCase() === admin.toLowerCase() ||
    user?.email?.toLowerCase() === admin.toLowerCase()
  );
}





















  getCurrentUserId(): string | null {
    return this.user()?._id || null;
  }

  isTokenExpired(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return true;

    try {
      const decoded: any = jwtDecode(token);
      const exp = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      return exp < now;
    } catch (error) {
      return true;
    }
  }

  checkAmkaAvailable(amka: string) {
    return this.http.post<ICheckAmkaResponse>(
      `${environment.apiUrl}/api/users/check-amka`, 
      { amka }
    );
  }

  // Error Handling
  setError(message: string): void {
    this.error.set(message);
    this.loading.set(false);
  }

  clearError(): void {
    this.error.set('');
  }
}