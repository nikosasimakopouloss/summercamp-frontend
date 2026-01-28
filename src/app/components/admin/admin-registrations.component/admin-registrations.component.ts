import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Services
import { RegistrationService } from '../../../shared/services/registration.service';
import { CamperService } from '../../../shared/services/camper.service';
import { UserService } from '../../../shared/services/user.service';

// Interfaces
import { IRegistration } from '../../../shared/interfaces/registration';
import { ICamper } from '../../../shared/interfaces/camper';
import { IBasicUser, IUser } from '../../../shared/interfaces/user';

@Component({
  selector: 'app-admin-registrations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    DatePipe
  ],
  templateUrl: './admin-registrations.component.html',
  styleUrls: ['./admin-registrations.component.css']
})
export class AdminRegistrationsComponent implements OnInit {
  private destroy$ = new Subject<void>();
  
  // Services
  private fb = inject(FormBuilder);
  private registrationService = inject(RegistrationService);
  private camperService = inject(CamperService);
  private userService = inject(UserService);
  private router = inject(Router);
  
  // Component state
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  error = signal<string>('');
  
  // Data
  allRegistrations = signal<IRegistration[]>([]);
  allCampers = signal<ICamper[]>([]);
  allUsers = signal<IUser[]>([]);
  
  // Filter form
  filterForm!: FormGroup;
  
  // Search
  searchTerm = signal<string>('');
  
  // Computed properties
  filteredRegistrations = computed(() => {
    let registrations = [...this.allRegistrations()];
    const search = this.searchTerm().toLowerCase().trim();
    const filters = this.filterForm?.value || {};

















    
    // Apply search filter
    // if (search) {
    //   registrations = registrations.filter(reg => {
    //     const camper = this.getCamper(reg.camper);
    //     const user = this.getUser(reg.user);
        
    //     return (
    //       reg.beneficiary?.toLowerCase().includes(search) ||
    //       reg.motherName?.toLowerCase().includes(search) ||
    //       reg.fatherName?.toLowerCase().includes(search) ||
    //       reg.amka?.includes(search) ||
    //       camper?.fullName?.toLowerCase().includes(search) ||
    //       user?.username?.toLowerCase().includes(search) ||
    //       user?.email?.toLowerCase().includes(search) ||
    //       reg.notes?.toLowerCase().includes(search)
    //     );
    //   });
    // }


   






    
    // Apply filters
    if (filters.campType) {
      registrations = registrations.filter(reg => reg.campType === filters.campType);
    }
    
    if (filters.status) {
      if (filters.status === 'active') {
        registrations = registrations.filter(reg => reg.isActive === true);
      } else if (filters.status === 'inactive') {
        registrations = registrations.filter(reg => reg.isActive === false);
      }
    }
    
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      if (start) {
        registrations = registrations.filter(reg => {
          const regDate = new Date(reg.registrationDate);
          return regDate >= new Date(start);
        });
      }
      if (end) {
        registrations = registrations.filter(reg => {
          const regDate = new Date(reg.registrationDate);
          return regDate <= new Date(end);
        });
      }
    }
    
    // Apply sorting (newest first by default)
    return registrations.sort((a, b) => {
      const dateA = new Date(a.registrationDate || 0).getTime();
      const dateB = new Date(b.registrationDate || 0).getTime();
      return dateB - dateA;
    });
  });
  
  // Statistics
  stats = computed(() => {
    const registrations = this.allRegistrations();
    
    return {
      total: registrations.length,
      active: registrations.filter(r => r.isActive).length,
      inactive: registrations.filter(r => !r.isActive).length,
      summer: registrations.filter(r => r.campType === 'summer').length,
      winter: registrations.filter(r => r.campType === 'winter').length,
      easter: registrations.filter(r => r.campType === 'easter').length,
      weekend: registrations.filter(r => r.campType === 'weekend').length,
      showing: this.filteredRegistrations().length
    };
  });
  
  // Camp type options
  campTypes = signal([
    { value: 'summer', label: 'Summer Camp' },
    { value: 'winter', label: 'Winter Camp' },
    { value: 'easter', label: 'Easter Camp' },
    { value: 'weekend', label: 'Weekend Camp' }
  ]);
  
  // Status options
  statusOptions = signal([
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]);
  
  // Timeline status options
  timelineOptions = signal([
    { value: 'all', label: 'All Timeline' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ]);
  
  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadData();
  }
  
  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      campType: [''],
      status: ['all'],
      timeline: ['all'],
      dateRange: this.fb.group({
        start: [''],
        end: ['']
      })
    });
    
    // Reset filters when form changes
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // We'll use the form values in filteredRegistrations computed property
      });
  }
  
  private loadData(): void {
    this.loading.set(true);
    this.error.set('');
    
    // Load all registrations
    this.registrationService.getAllRegistrations().subscribe({
      next: (registrations) => {
        this.allRegistrations.set(registrations);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load registrations: ' + (error.error?.message || error.message));
        this.loading.set(false);
      }
    });
    
    // Load all campers for lookup
    this.camperService.getAllCampers().subscribe({
      next: (campers) => {
        this.allCampers.set(campers);
      },
      error: (error) => {
        console.error('Failed to load campers:', error);
      }
    });
    
    // Load all users for lookup
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers.set(users);
      },
      error: (error) => {
        console.error('Failed to load users:', error);
      }
    });
  }
  
  // Helper methods
  // getCamper(camperId: string): ICamper | undefined {
  //   return this.allCampers().find(c => c._id === camperId);
  // }
  
  // getUser(userId: string): IUser | undefined {
  //   return this.allUsers().find(u => u._id === userId);
  // }

getCamper(camperId: string | ICamper): ICamper | undefined {
  if (typeof camperId === 'string') {
    return this.allCampers().find(c => c._id === camperId);
  }
  return camperId;
}

getUser(userId: string | IBasicUser | IUser): IUser | IBasicUser | undefined {
  if (typeof userId === 'string') {
    return this.allUsers().find(u => u._id === userId);
  }
  return userId;
}







  
  // getCamperName(camperId: string): string {
  //   const camper = this.getCamper(camperId);
  //   return camper?.fullName || 'Unknown Camper';
  // }
  
  // getUserName(userId: string): string {
  //   const user = this.getUser(userId);
  //   return user?.username || 'Unknown User';
  // }
  
  // getCamperAge(camperId: string): number {
  //   const camper = this.getCamper(camperId);
  //   if (!camper?.dateOfBirth) return 0;
    
  //   const birthDate = new Date(camper.dateOfBirth);
  //   const today = new Date();
  //   let age = today.getFullYear() - birthDate.getFullYear();
  //   const monthDiff = today.getMonth() - birthDate.getMonth();
    
  //   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
  //     age--;
  //   }
    
  //   return age;
  // }
  
  formatCampPeriod(period: string): string {
    if (!period) return 'N/A';
    
    const parts = period.split(' to ');
    if (parts.length === 2) {
      try {
        const start = new Date(parts[0]);
        const end = new Date(parts[1]);
        
        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${end.getDate()}, ${start.getFullYear()}`;
        } else {
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
        }
      } catch {
        return period;
      }
    }
    
    return period;
  }
  
  // Search methods
  updateSearch(search: string): void {
    this.searchTerm.set(search);
  }
  
  clearSearch(): void {
    this.searchTerm.set('');
  }
  
  clearFilters(): void {
    this.searchTerm.set('');
    this.filterForm.reset({
      campType: '',
      status: 'all',
      timeline: 'all',
      dateRange: { start: '', end: '' }
    });
  }
  
  // Navigation methods
  viewRegistration(registrationId: string | undefined): void {
    if (registrationId) {
      this.router.navigate(['/admin/registrations', registrationId]);
    }
  }
  
  editRegistration(registrationId: string | undefined): void {
    if (registrationId) {
      this.router.navigate(['/admin/registrations/edit', registrationId]);
    }
  }
  
  // Registration actions
  toggleRegistrationStatus(registration: IRegistration): void {
    const newStatus = !registration.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this registration?`)) {
      this.saving.set(true);
      
      this.registrationService.updateAnyRegistration(registration._id!, {
        ...registration,
        isActive: newStatus
      }).subscribe({
        next: (updatedRegistration) => {
          this.updateRegistrationInList(updatedRegistration);
          this.saving.set(false);
        },
        error: (error) => {
          this.error.set(`Failed to ${action} registration: ${error.error?.message || error.message}`);
          this.saving.set(false);
        }
      });
    }
  }
  
  deleteRegistration(registration: IRegistration): void {
    if (confirm(`Are you sure you want to delete registration for "${registration.beneficiary}"?`)) {
      this.saving.set(true);
      
      this.registrationService.deleteAnyRegistration(registration._id!).subscribe({
        next: () => {
          this.removeRegistrationFromList(registration._id!);
          this.saving.set(false);
        },
        error: (error) => {
          this.error.set(`Failed to delete registration: ${error.error?.message || error.message}`);
          this.saving.set(false);
        }
      });
    }
  }
  
  // List management
  private updateRegistrationInList(updatedRegistration: IRegistration): void {
    this.allRegistrations.update(registrations => 
      registrations.map(reg => 
        reg._id === updatedRegistration._id ? updatedRegistration : reg
      )
    );
  }
  
  private removeRegistrationFromList(registrationId: string): void {
    this.allRegistrations.update(registrations => 
      registrations.filter(reg => reg._id !== registrationId)
    );
  }
  
  // Status badges
  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge-active' : 'badge-inactive';
  }
  
  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }
  
  // Camp type badges
  getCampTypeBadgeClass(campType: string): string {
    switch (campType) {
      case 'summer': return 'badge-summer';
      case 'winter': return 'badge-winter';
      case 'easter': return 'badge-easter';
      case 'weekend': return 'badge-weekend';
      default: return 'badge-default';
    }
  }
  
  getCampTypeText(campType: string): string {
    switch (campType) {
      case 'summer': return 'Summer';
      case 'winter': return 'Winter';
      case 'easter': return 'Easter';
      case 'weekend': return 'Weekend';
      default: return campType;
    }
  }
  
  // Timeline status
  isUpcoming(registration: IRegistration): boolean {
    if (!registration.campPeriod) return false;
    
    const parts = registration.campPeriod.split(' to ');
    if (parts.length === 2) {
      try {
        const startDate = new Date(parts[0]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return startDate > today;
      } catch {
        return false;
      }
    }
    return false;
  }
  
  isInProgress(registration: IRegistration): boolean {
    if (!registration.campPeriod) return false;
    
    const parts = registration.campPeriod.split(' to ');
    if (parts.length === 2) {
      try {
        const startDate = new Date(parts[0]);
        const endDate = new Date(parts[1]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today >= startDate && today <= endDate;
      } catch {
        return false;
      }
    }
    return false;
  }
  
  getTimelineStatus(registration: IRegistration): string {
    if (this.isInProgress(registration)) return 'in-progress';
    if (this.isUpcoming(registration)) return 'upcoming';
    return 'completed';
  }
  
  getTimelineStatusText(registration: IRegistration): string {
    if (this.isInProgress(registration)) return 'In Progress';
    if (this.isUpcoming(registration)) return 'Upcoming';
    return 'Completed';
  }
  
  getTimelineStatusClass(registration: IRegistration): string {
    if (this.isInProgress(registration)) return 'timeline-in-progress';
    if (this.isUpcoming(registration)) return 'timeline-upcoming';
    return 'timeline-completed';
  }
  
  // Export to CSV
  // exportToCSV(): void {
  //   const headers = [
  //     'ID', 'Camper', 'Parent', 'Camp Type', 'Camp Period',
  //     'Beneficiary', 'Mother', 'Father', 'Registration Date',
  //     'Status', 'Timeline', 'Notes'
  //   ];
    
  //   const data = this.filteredRegistrations().map(reg => [
  //     reg._id?.substring(0, 8) || '',
  //     this.getCamperName(reg.camper),
  //     this.getUserName(reg.user),
  //     this.getCampTypeText(reg.campType),
  //     this.formatCampPeriod(reg.campPeriod),
  //     reg.beneficiary || '',
  //     reg.motherName || '',
  //     reg.fatherName || '',
  //     reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString() : '',
  //     this.getStatusText(reg.isActive),
  //     this.getTimelineStatusText(reg),
  //     reg.notes || ''
  //   ]);
    
  //   const csvContent = [
  //     headers.join(','),
  //     ...data.map(row => row.map(cell => `"${cell}"`).join(','))
  //   ].join('\n');
    
  //   const blob = new Blob([csvContent], { type: 'text/csv' });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`;
  //   a.click();
  //   window.URL.revokeObjectURL(url);
  // }



// Helper to safely get camper display name
getCamperDisplay(camper: string | ICamper | undefined): string {
  if (!camper) return 'Άγνωστος Κατασκηνωτής';
  
  if (typeof camper === 'string') {
    // It's just an ID, try to find in campers list
    const foundCamper = this.allCampers().find(c => c._id === camper);
    return foundCamper?.fullName || `ID: ${camper.substring(0, 8)}...`;
  }
  
  // It's a populated camper object
  return camper.fullName || 'Άγνωστος Κατασκηνωτής';
}

// Helper to safely get camper object (if populated) or ID
getCamperId(camper: string | ICamper | undefined): string {
  if (!camper) return '';
  
  if (typeof camper === 'string') {
    return camper;
  }
  
  return camper._id || '';
}

// Helper to safely get user display name
getUserDisplay(user: string | IBasicUser | IUser |undefined): string {
  if (!user) return 'Άγνωστος Χρήστης';
  
  if (typeof user === 'string') {
    // It's just an ID, try to find in users list
    const foundUser = this.allUsers().find(u => u._id === user);
    return foundUser?.username || `ID: ${user.substring(0, 8)}...`;
  }
  
  // It's a populated user object
  if (user.firstname && user.lastname) {
    return `${user.firstname} ${user.lastname}`;
  }
  
  return user.username || 'Άγνωστος Χρήστης';
}

// Helper to safely get user object (if populated) or ID
getUserId(user: string | IBasicUser | IUser | undefined): string {
  if (!user) return '';
  
  if (typeof user === 'string') {
    return user;
  }
  
  return user._id || '';
}

// Helper to get user email
getUserEmail(user: string | IBasicUser | IUser |undefined): string {
  if (!user || typeof user === 'string') return '';
  return user.email || '';
}

// Update the existing getCamperName method to use helper
getCamperName(camperId: string | ICamper): string {
  if (typeof camperId === 'string') {
    const camper = this.getCamper(camperId);
    return camper?.fullName || 'Unknown Camper';
  }
  return this.getCamperDisplay(camperId);
}

// Update the existing getUserName method to use helper
getUserName(userId: string | IBasicUser | IUser): string {
  if (typeof userId === 'string') {
    const user = this.getUser(userId);
    return user?.username || 'Unknown User';
  }
  return this.getUserDisplay(userId);
}

// Update getCamperAge to handle both string and object
getCamperAge(camperId: string | ICamper): number {
  let camper: ICamper | undefined;
  
  if (typeof camperId === 'string') {
    camper = this.getCamper(camperId);
  } else {
    camper = camperId;
  }
  
  if (!camper?.dateOfBirth) return 0;
  
  const birthDate = new Date(camper.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}







exportToCSV(): void {
  const headers = [
    'ID', 'Κατασκηνωτής', 'Γονέας', 'Τύπος Κατασκήνωσης', 'Περίοδος',
    'Οφελούμενος', 'Μητέρα', 'Πατέρας', 'Ημερομηνία Εγγραφής',
    'Κατάσταση', 'Περίοδος', 'Σημειώσεις'
  ];
  
  const data = this.filteredRegistrations().map(reg => [
    reg._id?.substring(0, 8) || '',
    this.getCamperDisplay(reg.camper),
    this.getUserDisplay(reg.user),
    this.getCampTypeText(reg.campType),
    this.formatCampPeriod(reg.campPeriod),
    reg.beneficiary || '',
    reg.motherName || '',
    reg.fatherName || '',
    reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString('el-GR') : '',
    this.getStatusText(reg.isActive),
    this.getTimelineStatusText(reg),
    reg.notes || ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `εγγραφές_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}


viewUserProfile(user: string | IBasicUser | undefined): void {
  const userId = this.getUserId(user);
  if (userId) {
    this.router.navigate(['/admin/users', userId]);
  }
}









  
  // Refresh data
  refresh(): void {
    this.loadData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}