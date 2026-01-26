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

  isAdmin(): boolean {
    const user = this.user();
    return user?.roles?.includes('admin') || false;
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