import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// Services
import { UserService } from '../../../shared/services/user.service';
import { RegistrationService } from '../../../shared/services/registration.service';

// Interfaces
import { IUser, ILoggedInUser } from '../../../shared/interfaces/user';
import { IRegistration } from '../../../shared/interfaces/registration';

// Components
// import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    FormsModule
    // LoadingSpinnerComponent
  ],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  // Services
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private registrationService = inject(RegistrationService);
  private router = inject(Router);
  
  // Component state
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');
  
  // Users data
  allUsers = signal<IUser[]>([]);
  currentUser = this.userService.user;
  
  // Filter and search
  searchTerm = signal<string>('');
  filterRole = signal<string>('');
  sortBy = signal<'username' | 'createdAt' | 'lastLogin'>('username');
  sortAscending = signal<boolean>(true);
  
  // User registration stats (for showing user activity)
  userRegistrations = signal<Map<string, number>>(new Map());
  
  // Form state
  showUserForm = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  selectedUser = signal<IUser | null>(null);
  
  // User form
  userForm!: FormGroup;
  
  // Role options
  roleOptions = [
    { value: 'parent', label: 'Parent' },
    { value: 'admin', label: 'Administrator' }
  ];
  
  // Computed properties
  filteredUsers = computed(() => {
    let users = [...this.allUsers()];
    const search = this.searchTerm().toLowerCase().trim();
    const role = this.filterRole();
    
    // Apply search filter
    if (search) {
      users = users.filter(user =>
        user.username?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.firstname?.toLowerCase().includes(search) ||
        user.lastname?.toLowerCase().includes(search) ||
        user.amka?.includes(search)
      );
    }
    
    // Apply role filter
    if (role) {
      users = users.filter(user => 
        user.roles?.includes(role) || false
      );
    }
    
    // Apply sorting
    return users.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy()) {
        case 'username':
          comparison = (a.username || '').localeCompare(b.username || '');
          break;
        case 'createdAt':
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        // case 'lastLogin':
        //   // Assuming lastLogin is a field in IUser, if not we can ignore
        //   const loginA = new Date((a as any).lastLogin || 0).getTime();
        //   const loginB = new Date((b as any).lastLogin || 0).getTime();
        //   comparison = loginA - loginB;
        //   break;
      }
      
      return this.sortAscending() ? comparison : -comparison;
    });
  });
  
  // Statistics
  stats = computed(() => {
    const users = this.allUsers();
    
    return {
      total: users.length,
      parents: users.filter(u => u.roles?.includes('parent')).length,
      admins: users.filter(u => u.roles?.includes('admin')).length,
      activeToday: 0, // Would need lastLogin data
      showing: this.filteredUsers().length
    };
  });
  
  // Get registrations count for a user
  getUserRegistrationsCount(userId: string): number {
    return this.userRegistrations().get(userId) || 0;
  }
  
  // Get campers count for a user (would need camper service)
  getUserCampersCount(userId: string): number {
    // This would require loading campers per user
    // For now, we'll return 0 or implement if needed
    return 0;
  }
  
  ngOnInit(): void {
    this.initializeForm();
    this.loadUsers();
    
    // Clear messages after 5 seconds
    setTimeout(() => {
      this.success.set('');
      this.error.set('');
    }, 5000);
  }
  
  private initializeForm(): void {
    this.userForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      amka: ['', [
        Validators.required,
        Validators.pattern(/^\d{11}$/),
        Validators.minLength(11),
        Validators.maxLength(11)
      ]],
      password: ['', [
        Validators.minLength(6),
        Validators.maxLength(100)
      ]],
      confirmPassword: [''],
      roles: [['parent'], Validators.required],
      isActive: [true]
    }, { validators: this.passwordMatchValidator });
  }
  
  private passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
    }
  }
  
  private loadUsers(): void {
    this.loading.set(true);
    this.error.set('');
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers.set(users);
        this.loadUserRegistrations(users);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load users: ' + (error.error?.message || error.message));
        this.loading.set(false);
      }
    });
  }
  
  private loadUserRegistrations(users: IUser[]): void {
    // Load all registrations to count per user
    this.registrationService.getAllRegistrations().subscribe({
      next: (registrations) => {
        const regCountMap = new Map<string, number>();
        
        // Count registrations per user
        registrations.forEach(reg => {
          const currentCount = regCountMap.get(reg.user) || 0;
          regCountMap.set(reg.user, currentCount + 1);
        });
        
        this.userRegistrations.set(regCountMap);
      },
      error: (error) => {
        console.error('Failed to load registrations for stats:', error);
      }
    });
  }
  
  // Form field getters
  get username() { return this.userForm.get('username'); }
  get email() { return this.userForm.get('email'); }
  get firstname() { return this.userForm.get('firstname'); }
  get lastname() { return this.userForm.get('lastname'); }
  get amka() { return this.userForm.get('amka'); }
  get password() { return this.userForm.get('password'); }
  get confirmPassword() { return this.userForm.get('confirmPassword'); }
  get roles() { return this.userForm.get('roles'); }
  get isActive() { return this.userForm.get('isActive'); }
  
  // Form actions
  showAddUserForm(): void {
    this.isEditMode.set(false);
    this.selectedUser.set(null);
    this.userForm.reset({
      roles: ['parent'],
      isActive: true
    });
    
    // Clear password validation for new user
    this.userForm.get('password')?.setValidators([
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(100)
    ]);
    this.userForm.get('password')?.updateValueAndValidity();
    
    this.showUserForm.set(true);
  }
  
  showEditUserForm(user: IUser): void {
    this.isEditMode.set(true);
    this.selectedUser.set(user);
    
    // Populate form
    this.userForm.patchValue({
      username: user.username || '',
      email: user.email || '',
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      amka: user.amka || '',
      roles: user.roles || ['parent'],
      // isActive: user.isActive !== undefined ? user.isActive : true
    });
    
    // Password is optional in edit mode
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.setValidators([
      Validators.minLength(6),
      Validators.maxLength(100)
    ]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.clearValidators();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();
    
    this.showUserForm.set(true);
  }
  
  closeUserForm(): void {
    this.showUserForm.set(false);
    this.userForm.reset();
  }
  
  onSubmitUser(): void {
    if (this.userForm.invalid || this.saving()) {
      return;
    }
    
    this.saving.set(true);
    this.error.set('');
    
    const formValue = this.userForm.value;
    const userData: any = {
      username: formValue.username,
      email: formValue.email,
      firstname: formValue.firstname,
      lastname: formValue.lastname,
      amka: formValue.amka,
      roles: Array.isArray(formValue.roles) ? formValue.roles : [formValue.roles],
      isActive: formValue.isActive
    };
    
    // Add password only if provided (and not empty)
    if (formValue.password && formValue.password.trim()) {
      userData.password = formValue.password;
    }
    
    if (this.isEditMode() && this.selectedUser()?._id) {
      // Update existing user
      this.userService.updateUser(this.selectedUser()!._id!, userData).subscribe({
        next: (updatedUser) => {
          this.updateUserInList(updatedUser);
          this.handleSuccess('User updated successfully!');
        },
        error: (error) => {
          this.handleError(error, 'Failed to update user');
        }
      });
    } else {
      // Create new user
      this.userService.createUser(userData).subscribe({
        next: (newUser) => {
          this.allUsers.update(users => [...users, newUser]);
          this.handleSuccess('User created successfully!');
        },
        error: (error) => {
          this.handleError(error, 'Failed to create user');
        }
      });
    }
  }
  
  private updateUserInList(updatedUser: IUser): void {
    this.allUsers.update(users => 
      users.map(user => 
        user._id === updatedUser._id ? updatedUser : user
      )
    );
  }
  
  // User actions
  // toggleUserStatus(user: IUser): void {
  //   const newStatus = !user.isActive;
  //   const action = newStatus ? 'activate' : 'deactivate';
    
  //   if (confirm(`Are you sure you want to ${action} user "${user.username}"?`)) {
  //     this.userService.updateUser(user._id!, { isActive: newStatus }).subscribe({
  //       next: (updatedUser) => {
  //         this.updateUserInList(updatedUser);
  //         this.success.set(`User ${action}d successfully!`);
  //       },
  //       error: (error) => {
  //         this.error.set(`Failed to ${action} user: ${error.error?.message || error.message}`);
  //       }
  //     });
  //   }
  // }
  
  deleteUser(user: IUser): void {
    // Check if user has registrations
    const regCount = this.getUserRegistrationsCount(user._id!);
    
    if (regCount > 0) {
      if (!confirm(`User "${user.username}" has ${regCount} registration(s). Are you sure you want to delete? This will also delete all their registrations.`)) {
        return;
      }
    } else if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }
    
    this.userService.deleteUser(user._id!).subscribe({
      next: () => {
        this.allUsers.update(users => users.filter(u => u._id !== user._id));
        this.success.set('User deleted successfully!');
      },
      error: (error) => {
        this.error.set(`Failed to delete user: ${error.error?.message || error.message}`);
      }
    });
  }
  
  viewUserDetails(user: IUser): void {
    // Navigate to user detail view or open modal
    // For now, we'll just log
    console.log('View user details:', user);
  }
  
  // Filter and search methods
  updateSearch(search: string): void {
    this.searchTerm.set(search);
  }
  
  updateRoleFilter(role: string): void {
    this.filterRole.set(role);
  }
  
  clearFilters(): void {
    this.searchTerm.set('');
    this.filterRole.set('');
  }
  
  changeSort(field: 'username' | 'createdAt' | 'lastLogin'): void {
    if (this.sortBy() === field) {
      this.sortAscending.update(value => !value);
    } else {
      this.sortBy.set(field);
      this.sortAscending.set(true);
    }
  }
  
  // Helper methods
  private handleSuccess(message: string): void {
    this.saving.set(false);
    this.success.set(message);
    this.closeUserForm();
    
    setTimeout(() => {
      this.success.set('');
    }, 5000);
  }
  
  private handleError(error: any, defaultMessage: string): void {
    this.error.set(error.error?.message || defaultMessage);
    this.saving.set(false);
    
    setTimeout(() => {
      this.error.set('');
    }, 5000);
  }
  
  // Role display
  getRoleBadgeClass(roles: string[] | undefined): string {
    if (!roles) return 'badge-default';
    if (roles.includes('admin')) return 'badge-admin';
    return 'badge-parent';
  }
  
  getRoleText(roles: string[] | undefined): string {
    if (!roles) return 'Unknown';
    if (roles.includes('admin')) return 'Administrator';
    return 'Parent';
  }
  
  // Status display
  getStatusBadgeClass(isActive: boolean | undefined): string {
    return isActive ? 'badge-active' : 'badge-inactive';
  }
  
  getStatusText(isActive: boolean | undefined): string {
    return isActive ? 'Active' : 'Inactive';
  }
  
  // Check if current user can edit/delete
  canModifyUser(user: IUser): boolean {
    const currentUserId = this.currentUser()?._id;
    return user._id !== currentUserId; // Cannot modify own account
  }
  
  // Export users to CSV
  exportToCSV(): void {
    const headers = ['Username', 'Email', 'First Name', 'Last Name', 'AMKA', 'Roles', 'Status', 'Registrations', 'Created'];
    const data = this.filteredUsers().map(user => [
      user.username || '',
      user.email || '',
      user.firstname || '',
      user.lastname || '',
      user.amka || '',
      user.roles?.join(', ') || '',
      // user.isActive ? 'Active' : 'Inactive',
      this.getUserRegistrationsCount(user._id!).toString(),
      user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  
  // Refresh data
  refresh(): void {
    this.loadUsers();
  }
}