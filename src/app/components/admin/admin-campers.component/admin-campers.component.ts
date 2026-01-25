import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Services
import { CamperService } from '../../../shared/services/camper.service';
import { UserService } from '../../../shared/services/user.service';
import { RegistrationService } from '../../../shared/services/registration.service';

// Interfaces
import { ICamper } from '../../../shared/interfaces/camper';
import { IUser } from '../../../shared/interfaces/user';

@Component({
  selector: 'app-admin-campers',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DatePipe
  ],
  templateUrl: './admin-campers.component.html',
  styleUrls: ['./admin-campers.component.css']
})
export class AdminCampersComponent implements OnInit {
  private destroy$ = new Subject<void>();
  
  // Services
  private camperService = inject(CamperService);
  private userService = inject(UserService);
  private registrationService = inject(RegistrationService);
  private router = inject(Router);
  
  // Component state
  loading = signal<boolean>(true);
  error = signal<string>('');
  
  // Data
  allUsers = signal<IUser[]>([]);
  allCampers = signal<ICamper[]>([]);
  
  // Filter and search
  searchTerm = signal<string>('');
  filterByParent = signal<string>('');
  filterByStatus = signal<string>('');
  filterByAgeGroup = signal<string>('');
  sortBy = signal<'name' | 'parent' | 'age' | 'createdAt'>('createdAt');
  sortAscending = signal<boolean>(false);
  
  // UI state
  showDeleteModal = signal<boolean>(false);
  selectedCamperForDelete = signal<ICamper | null>(null);
  showBulkActions = signal<boolean>(false);
  selectedCampers = signal<Set<string>>(new Set());
  
  // Computed properties
  filteredCampers = computed(() => {
    let campers = [...this.allCampers()];
    const search = this.searchTerm().toLowerCase().trim();
    const parentId = this.filterByParent();
    const status = this.filterByStatus();
    const ageGroup = this.filterByAgeGroup();
    const sortField = this.sortBy();
    const ascending = this.sortAscending();
    
    // Apply search filter
    if (search) {
      campers = campers.filter(camper =>
        camper.fullName?.toLowerCase().includes(search) ||
        camper.amka?.includes(search) ||
        camper.additionalInfo?.toLowerCase().includes(search) ||
        this.getParentName(camper.parent).toLowerCase().includes(search)
      );
    }
    
    // Apply parent filter
    if (parentId) {
      campers = campers.filter(camper => camper.parent === parentId);
    }
    
    // Apply status filter
    if (status) {
      if (status === 'health-accepted') {
        campers = campers.filter(camper => camper.healthDeclarationAccepted === true);
      } else if (status === 'health-pending') {
        campers = campers.filter(camper => camper.healthDeclarationAccepted === false);
      }
    }
    
    // Apply age group filter
    if (ageGroup) {
      campers = campers.filter(camper => {
        const age = this.calculateAge(camper.dateOfBirth);
        switch (ageGroup) {
          case 'preschool': return age < 6;
          case 'child': return age >= 6 && age < 13;
          case 'teen': return age >= 13 && age < 18;
          case 'adult': return age >= 18;
          default: return true;
        }
      });
    }
    
    // Apply sorting
    return campers.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = (a.fullName || '').localeCompare(b.fullName || '');
          break;
        case 'parent':
          const parentA = this.getParentName(a.parent);
          const parentB = this.getParentName(b.parent);
          comparison = parentA.localeCompare(parentB);
          break;
        case 'age':
          const ageA = this.calculateAge(a.dateOfBirth);
          const ageB = this.calculateAge(b.dateOfBirth);
          comparison = ageA - ageB;
          break;
        case 'createdAt':
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
      }
      
      return ascending ? comparison : -comparison;
    });
  });
  
  // Statistics
  stats = computed(() => {
    const campers = this.allCampers();
    const filtered = this.filteredCampers();
    
    return {
      total: campers.length,
      healthAccepted: campers.filter(c => c.healthDeclarationAccepted).length,
      healthPending: campers.filter(c => !c.healthDeclarationAccepted).length,
      showing: filtered.length,
      selected: this.selectedCampers().size,
      preschool: campers.filter(c => this.calculateAge(c.dateOfBirth) < 6).length,
      child: campers.filter(c => {
        const age = this.calculateAge(c.dateOfBirth);
        return age >= 6 && age < 13;
      }).length,
      teen: campers.filter(c => {
        const age = this.calculateAge(c.dateOfBirth);
        return age >= 13 && age < 18;
      }).length,
      adult: campers.filter(c => this.calculateAge(c.dateOfBirth) >= 18).length
    };
  });
  
  // Age groups for filtering
  ageGroups = [
    { value: '', label: 'All Ages' },
    { value: 'preschool', label: 'Preschool (0-5)' },
    { value: 'child', label: 'Child (6-12)' },
    { value: 'teen', label: 'Teen (13-17)' },
    { value: 'adult', label: 'Adult (18+)' }
  ];
  
  // Status options
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'health-accepted', label: 'Health Accepted' },
    { value: 'health-pending', label: 'Health Pending' }
  ];
  
  ngOnInit(): void {
    this.loadData();
  }
  
  private loadData(): void {
    this.loading.set(true);
    this.error.set('');
    
    // Load all campers
    this.camperService.getAllCampers().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (campers) => {
        this.allCampers.set(campers);
        this.loadUsers();
      },
      error: (error) => {
        this.error.set('Failed to load campers: ' + (error.error?.message || error.message));
        this.loading.set(false);
      }
    });
  }
  
  private loadUsers(): void {
    this.userService.getAllUsers().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (users) => {
        this.allUsers.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.loading.set(false);
      }
    });
  }
  
  // Helper methods
  getParentName(parentId: string): string {
    if (!parentId) return 'Unknown';
    
    const user = this.allUsers().find(u => u._id === parentId);
    if (!user) return `User (${parentId.substring(0, 8)}...)`;
    
    return `${user.firstname} ${user.lastname} (${user.username})`;
  }
  
  getUserEmail(parentId: string): string {
    const user = this.allUsers().find(u => u._id === parentId);
    return user?.email || 'N/A';
  }
  
  calculateAge(birthDate: string | Date | undefined): number {
    if (!birthDate) return 0;
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
  
  getAgeGroup(birthDate: string | Date | undefined): string {
    const age = this.calculateAge(birthDate);
    
    if (age < 6) return 'Preschool (0-5)';
    if (age < 13) return 'Child (6-12)';
    if (age < 18) return 'Teen (13-17)';
    return 'Adult (18+)';
  }
  
  getAgeGroupBadgeClass(birthDate: string | Date | undefined): string {
    const age = this.calculateAge(birthDate);
    
    if (age < 6) return 'badge-preschool';
    if (age < 13) return 'badge-child';
    if (age < 18) return 'badge-teen';
    return 'badge-adult';
  }
  
  getHealthStatusBadgeClass(healthAccepted: boolean | undefined): string {
    return healthAccepted ? 'badge-health-accepted' : 'badge-health-pending';
  }
  
  getHealthStatusText(healthAccepted: boolean | undefined): string {
    return healthAccepted ? 'Health Accepted' : 'Health Pending';
  }
  
  // Navigation methods
  viewCamper(camperId: string | undefined): void {
    if (camperId) {
      this.router.navigate(['/admin/campers', camperId]);
    }
  }
  
  editCamper(camperId: string | undefined): void {
    if (camperId) {
      this.router.navigate(['/admin/campers/edit', camperId]);
    }
  }
  
  navigateToUser(userId: string | undefined): void {
    if (userId) {
      this.router.navigate(['/admin/users', userId]);
    }
  }
  
  // Selection methods
  toggleCamperSelection(camperId: string): void {
    const selected = new Set(this.selectedCampers());
    if (selected.has(camperId)) {
      selected.delete(camperId);
    } else {
      selected.add(camperId);
    }
    this.selectedCampers.set(selected);
    this.showBulkActions.set(selected.size > 0);
  }
  
  toggleSelectAll(): void {
    if (this.selectedCampers().size === this.filteredCampers().length) {
      this.selectedCampers.set(new Set());
      this.showBulkActions.set(false);
    } else {
      const allIds = new Set(this.filteredCampers().map(c => c._id!).filter(id => !!id));
      this.selectedCampers.set(allIds);
      this.showBulkActions.set(true);
    }
  }
  
  isCamperSelected(camperId: string): boolean {
    return this.selectedCampers().has(camperId);
  }
  
  // Bulk actions
  bulkDeleteSelected(): void {
    const selectedCount = this.selectedCampers().size;
    if (selectedCount === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedCount} selected camper(s)? This action cannot be undone.`)) {
      this.loading.set(true);
      
      // In a real application, you would have a bulk delete endpoint
      // For now, we'll delete one by one
      const deletePromises = Array.from(this.selectedCampers()).map(id => 
        this.camperService.deleteAnyCamper(id).toPromise()
      );
      
      Promise.allSettled(deletePromises).then(results => {
        const successfulDeletes = results.filter(r => r.status === 'fulfilled').length;
        const failedDeletes = results.filter(r => r.status === 'rejected').length;
        
        // Reload data
        this.loadData();
        
        // Clear selection

        
        this.selectedCampers.set(new Set());
        this.showBulkActions.set(false);
        

        if (failedDeletes > 0) {
          this.error.set(`${successfulDeletes} camper(s) deleted, ${failedDeletes} failed`);
        } else {
          // Show success message
          setTimeout(() => {
            // Could show a toast here
          }, 100);
        }
      });
    }
  }
  
  bulkExportSelected(): void {
    const selectedIds = Array.from(this.selectedCampers());
    const selectedCampers = this.allCampers().filter(c => selectedIds.includes(c._id!));
    
    this.exportToCSV(selectedCampers, 'selected_campers');
  }
  
  // Individual delete operations
  promptDelete(camper: ICamper): void {
    this.selectedCamperForDelete.set(camper);
    this.showDeleteModal.set(true);
  }
  
  confirmDelete(): void {
    const camper = this.selectedCamperForDelete();
    if (!camper?._id) return;
    
    this.camperService.deleteAnyCamper(camper._id).subscribe({
      next: () => {
        this.allCampers.update(campers => campers.filter(c => c._id !== camper._id));
        this.closeDeleteModal();
      },
      error: (error) => {
        this.error.set('Failed to delete camper: ' + (error.error?.message || error.message));
        this.closeDeleteModal();
      }
    });
  }
  
  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedCamperForDelete.set(null);
  }
  
  // Filter methods
  updateSearch(search: string): void {
    this.searchTerm.set(search);
  }
  
  updateParentFilter(parentId: string): void {
    this.filterByParent.set(parentId);
  }
  
  updateStatusFilter(status: string): void {
    this.filterByStatus.set(status);
  }
  
  updateAgeGroupFilter(ageGroup: string): void {
    this.filterByAgeGroup.set(ageGroup);
  }
  
  clearFilters(): void {
    this.searchTerm.set('');
    this.filterByParent.set('');
    this.filterByStatus.set('');
    this.filterByAgeGroup.set('');
  }
  
  changeSort(field: 'name' | 'parent' | 'age' | 'createdAt'): void {
    if (this.sortBy() === field) {
      this.sortAscending.update(value => !value);
    } else {
      this.sortBy.set(field);
      this.sortAscending.set(field === 'createdAt' ? false : true);
    }
  }
  
  // Export functionality
  exportAllToCSV(): void {
    this.exportToCSV(this.filteredCampers(), 'all_campers');
  }
  
  private exportToCSV(campers: ICamper[], filename: string): void {
    const headers = ['Full Name', 'Age', 'Age Group', 'AMKA', 'Health Status', 'Parent Name', 'Parent Email', 'Additional Info', 'Created'];
    const data = campers.map(camper => [
      camper.fullName || '',
      this.calculateAge(camper.dateOfBirth).toString(),
      this.getAgeGroup(camper.dateOfBirth),
      camper.amka || '',
      this.getHealthStatusText(camper.healthDeclarationAccepted),
      this.getParentName(camper.parent),
      this.getUserEmail(camper.parent),
      camper.additionalInfo || '',
      camper.createdAt ? new Date(camper.createdAt).toLocaleDateString() : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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