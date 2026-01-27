import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { CamperService } from '../../../shared/services/camper.service';
import { RegistrationService } from '../../../shared/services/registration.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { IUser } from '../../../shared/interfaces/user';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  userService = inject(UserService);
  private camperService = inject(CamperService);
  private registrationService = inject(RegistrationService);
  private http = inject(HttpClient);
  
  // Admin data signals
  allUsers = signal<IUser[]>([]);
  allCampers = signal<any[]>([]);
  allRegistrations = signal<any[]>([]);
  loading = signal<boolean>(true);
  
  // Current time for the footer
  currentTime = new Date().toLocaleString('el-GR');
  
  ngOnInit(): void {
    if (this.userService.isLoggedIn() && this.userService.isAdmin()) {
      this.loadAdminData();
    } else if (this.userService.isLoggedIn() && !this.userService.isAdmin()) {
      // Redirect to regular dashboard if not admin
      window.location.href = '/dashboard';
    }
  }

  get user() {
    return this.userService.user();
  }

  get isAdmin() {
    return this.userService.isAdmin();
  }

  // Load all admin data
  private loadAdminData(): void {
    this.loading.set(true);
    
    // Load all users
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading.set(false);
      }
    });
    
    // You'll need to add similar methods to CamperService and RegistrationService
    // For now, we'll use empty arrays or call existing methods
    this.loadAllCampers();
    this.loadAllRegistrations();
  }

  // Load all campers - you need to add this method to CamperService
  private loadAllCampers(): void {
    // Assuming your CamperService has a getAllCampers method
    this.camperService.getAllCampers().subscribe(campers => {
      this.allCampers.set(campers);
    });
    
    // For now, using user campers as placeholder
    if (this.camperService['campers']) {
      this.allCampers.set(this.camperService['campers']() || []);
    }
  }

  // Load all registrations - you need to add this method to RegistrationService
  private loadAllRegistrations(): void {
    // Assuming your RegistrationService has a getAllRegistrations method
    this.registrationService.getAllRegistrations().subscribe(regs => {
      this.allRegistrations.set(regs);
    });
    
    // For now, using user registrations as placeholder
    if (this.registrationService['registrations']) {
      this.allRegistrations.set(this.registrationService['registrations']() || []);
    }
  }

  // Computed properties for statistics
  get totalUsers(): number {
    return this.allUsers().length;
  }

  get totalCampers(): number {
    return this.allCampers().length;
  }

  get totalRegistrations(): number {
    return this.allRegistrations().length;
  }

  get pendingRegistrations(): number {
    // Assuming registrations have a status field
    return this.allRegistrations().filter(reg => 
      reg.status === 'pending' || reg.status === 'Pending'
    ).length;
  }

  // Get recent users (last 5)
  get recentUsers() {
    return this.allUsers()
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }

  // Get recent campers (last 5)
  get recentCampers() {
    return this.allCampers()
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }

  // Helper method to extract role names from role objects
  getUserRoleNames(user: IUser): string[] {
    if (!user.roles) return [];
    
    return user.roles.map((role: any) => {
      if (typeof role === 'string') {
        return role;
      } else if (role && typeof role === 'object') {
        return role.role || '';
      }
      return '';
    }).filter(Boolean);
  }

  // Format date for display
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '--';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('el-GR');
  }

  logout(): void {
    this.userService.logoutUser();
  }

  // Refresh admin data
  refreshData(): void {
    this.loadAdminData();
  }
}