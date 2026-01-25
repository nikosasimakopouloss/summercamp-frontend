import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Services
import { RegistrationService } from '../../../shared/services/registration.service';
import { CamperService } from '../../../shared/services/camper.service';
import { UserService } from '../../../shared/services/user.service';

// Interfaces
import { IRegistration } from '../../../shared/interfaces/registration';
import { ICamper } from '../../../shared/interfaces/camper';

@Component({
  selector: 'app-registration-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DatePipe
  ],
  templateUrl: './registration-list.component.html',
  styleUrls: ['./registration-list.component.css']
})
export class RegistrationListComponent implements OnInit {
  // Services
   registrationService = inject(RegistrationService);
  private camperService = inject(CamperService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  // Component state
  searchTerm = signal<string>('');
  filterCampType = signal<string>('');
  filterStatus = signal<string>('');
  sortBy = signal<'date' | 'camper' | 'campType'>('date');
  sortAscending = signal<boolean>(false); // Newest first by default
  
  // Data
  campers = signal<ICamper[]>([]);
  
  // Use service signals directly
  registrations = this.registrationService.registrations;
  loading = this.registrationService.loading;
  error = this.registrationService.error;
  
  // Camp type options
  campTypes = signal([
    { value: 'summer', label: 'Summer Camp' },
    { value: 'winter', label: 'Winter Camp' },
    { value: 'easter', label: 'Easter Camp' },
    { value: 'weekend', label: 'Weekend Camp' }
  ]);
  
  // Status options
  statusOptions = signal([
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]);
  
  // Computed properties
  filteredRegistrations = computed(() => {
    let registrations = [...(this.registrations() || [])];
    const search = this.searchTerm().toLowerCase().trim();
    const campType = this.filterCampType();
    const status = this.filterStatus();
    const sortField = this.sortBy();
    const ascending = this.sortAscending();
    
    // Apply search filter
    if (search) {
      registrations = registrations.filter(reg =>
        reg.beneficiary?.toLowerCase().includes(search) ||
        reg.motherName?.toLowerCase().includes(search) ||
        reg.fatherName?.toLowerCase().includes(search) ||
        reg.notes?.toLowerCase().includes(search) ||
        this.getCamperName(reg.camper).toLowerCase().includes(search)
      );
    }
    
    // Apply camp type filter
    if (campType) {
      registrations = registrations.filter(reg => reg.campType === campType);
    }
    
    // Apply status filter
    if (status) {
      if (status === 'active') {
        registrations = registrations.filter(reg => reg.isActive === true);
      } else if (status === 'inactive') {
        registrations = registrations.filter(reg => reg.isActive === false);
      }
    }
    
    // Apply sorting
    return registrations.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          const dateA = new Date(a.registrationDate || 0).getTime();
          const dateB = new Date(b.registrationDate || 0).getTime();
          comparison = dateA - dateB;
          break;
        case 'camper':
          const nameA = this.getCamperName(a.camper).toLowerCase();
          const nameB = this.getCamperName(b.camper).toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case 'campType':
          const typeA = a.campType?.toLowerCase() || '';
          const typeB = b.campType?.toLowerCase() || '';
          comparison = typeA.localeCompare(typeB);
          break;
      }
      
      return ascending ? comparison : -comparison;
    });
  });
  
  // Statistics
  stats = computed(() => {
    const registrations = this.registrations() || [];
    const filtered = this.filteredRegistrations();
    
    return {
      total: registrations.length,
      active: registrations.filter(r => r.isActive).length,
      inactive: registrations.filter(r => !r.isActive).length,
      showing: filtered.length,
      summer: registrations.filter(r => r.campType === 'summer').length,
      winter: registrations.filter(r => r.campType === 'winter').length,
      easter: registrations.filter(r => r.campType === 'easter').length,
      weekend: registrations.filter(r => r.campType === 'weekend').length
    };
  });
  
  // Empty state
  isEmpty = computed(() => {
    return !this.loading() && this.filteredRegistrations().length === 0;
  });
  
  ngOnInit(): void {
    this.loadData();
    
    // Check for success message from form submission
    this.route.queryParams.subscribe(params => {
      if (params['success']) {
        // Could show a success toast here
        console.log('Success:', params['success']);
        // Clear the query param
        this.router.navigate([], { queryParams: {} });
      }
    });
  }
  
  private loadData(): void {
    // Load parent's registrations
    this.registrationService.loadUserRegistrations();
    
    // Load parent's campers for name mapping
    this.camperService.getUserCampers().subscribe({
      next: (campers) => {
        this.campers.set(campers);
      },
      error: (error) => {
        console.error('Failed to load campers:', error);
      }
    });
  }
  
  // Helper methods
  getCamperName(camperId: string): string {
    const camper = this.campers().find(c => c._id === camperId);
    return camper?.fullName || 'Unknown Camper';
  }
  
  getCamperAge(camperId: string): number {
    const camper = this.campers().find(c => c._id === camperId);
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
  
  formatCampPeriod(period: string): string {
    if (!period) return 'N/A';
    
    // Try to format "2024-07-01 to 2024-07-15" to "Jul 1 - 15, 2024"
    const parts = period.split(' to ');
    if (parts.length === 2) {
      try {
        const start = new Date(parts[0]);
        const end = new Date(parts[1]);
        
        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
          // Same month: "Jul 1-15, 2024"
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${end.getDate()}, ${start.getFullYear()}`;
        } else {
          // Different months: "Jul 1 - Aug 15, 2024"
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
        }
      } catch {
        return period;
      }
    }
    
    return period;
  }
  
  // Navigation methods
  viewRegistration(registrationId: string | undefined): void {
    if (registrationId) {
      this.router.navigate(['/registrations', registrationId]);
    }
  }
  
  editRegistration(registrationId: string | undefined): void {
    if (registrationId) {
      this.router.navigate(['/registrations/edit', registrationId]);
    }
  }
  
  navigateToCreate(): void {
    // Check if user has campers first
    if (this.campers().length === 0) {
      this.router.navigate(['/campers/new'], {
        queryParams: { redirect: 'registrations/new' }
      });
    } else {
      this.router.navigate(['/registrations/new']);
    }
  }
  
  // Delete operations
  promptDelete(registration: IRegistration): void {
    if (confirm(`Are you sure you want to delete the registration for ${registration.beneficiary}?`)) {
      this.deleteRegistration(registration);
    }
  }
  
  deleteRegistration(registration: IRegistration): void {
    if (!registration._id) return;
    
    this.registrationService.deleteRegistration(registration._id).subscribe({
      next: () => {
        this.registrationService.removeRegistrationFromList(registration._id!);
      },
      error: (error) => {
        this.registrationService.error.set(error.error?.message || 'Failed to delete registration');
      }
    });
  }
  
  // Filter methods
  updateSearch(search: string): void {
    this.searchTerm.set(search);
  }
  
  updateCampTypeFilter(type: string): void {
    this.filterCampType.set(type);
  }
  
  updateStatusFilter(status: string): void {
    this.filterStatus.set(status);
  }
  
  clearFilters(): void {
    this.searchTerm.set('');
    this.filterCampType.set('');
    this.filterStatus.set('');
  }
  
  toggleSort(): void {
    this.sortAscending.update(value => !value);
  }
  
  changeSort(field: 'date' | 'camper' | 'campType'): void {
    if (this.sortBy() === field) {
      this.toggleSort();
    } else {
      this.sortBy.set(field);
      this.sortAscending.set(field === 'date' ? false : true);
    }
  }
  
  // Status badge
  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge-active' : 'badge-inactive';
  }
  
  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }
  
  // Camp type badge
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
  
  // Check if registration is upcoming
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
  
  // Check if registration is in progress
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
  
  // Get registration timeline status
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
  
  // Refresh data
  refresh(): void {
    this.loadData();
  }
}