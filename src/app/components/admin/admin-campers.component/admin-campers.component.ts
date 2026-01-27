import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CamperService } from '../../../shared/services/camper.service';
import { UserService } from '../../../shared/services/user.service';
import { ICamper } from '../../../shared/interfaces/camper';

@Component({
  selector: 'app-admin-campers',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './admin-campers.component.html',
  styleUrls: ['./admin-campers.component.css']
})
export class AdminCampersComponent implements OnInit {
  // Services
  private camperService = inject(CamperService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  // Expose Math to template (FIX for the error)
  Math = Math;
  
  // Local signals for component state
  searchTerm = signal<string>('');
  filterByAge = signal<string>('');
  sortBy = signal<'name' | 'age' | 'dateAdded'>('name');
  sortAscending = signal<boolean>(true);
  
  // Pagination signals
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);
  
  // UI state
  showDeleteModal = signal<boolean>(false);
  selectedCamperForDelete = signal<ICamper | null>(null);
  
  // Get campers from service
  campers = this.camperService.campers;
  loading = this.camperService.loading;
  error = this.camperService.error;
  
  // Check if user is admin (for safety, even though route is protected)
  get isAdmin(): boolean {
    return this.userService.isAdmin();
  }
  
  // Filtered and sorted campers
  filteredCampers = computed(() => {
    let campers = [...(this.campers() || [])];
    const search = this.searchTerm().toLowerCase().trim();
    const filter = this.filterByAge();
    const sortField = this.sortBy();
    const ascending = this.sortAscending();
    
    // Apply search filter
    if (search) {
      campers = campers.filter(camper =>
        (camper.fullName?.toLowerCase().includes(search) || false) ||
        (camper.amka?.includes(search) || false) ||
        (camper.additionalInfo?.toLowerCase().includes(search) || false) ||
        (camper.parent?.toLowerCase().includes(search) || false)
      );
    }
    
    // Apply age filter if set
    if (filter) {
      campers = campers.filter(camper => 
        this.getAgeGroup(camper.dateOfBirth) === filter
      );
    }
    
    // Apply sorting
    return campers.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = (a.fullName || '').localeCompare(b.fullName || '');
          break;
        case 'age':
          const ageA = this.calculateAge(a.dateOfBirth);
          const ageB = this.calculateAge(b.dateOfBirth);
          comparison = ageA - ageB;
          break;
        case 'dateAdded':
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
      }
      
      return ascending ? comparison : -comparison;
    });
  });
  
  // Paginated campers
  paginatedCampers = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredCampers().slice(startIndex, startIndex + this.itemsPerPage());
  });
  
  // Total pages
  totalPages = computed(() => {
    return Math.ceil(this.filteredCampers().length / this.itemsPerPage());
  });
  
  // Empty state
  isEmpty = computed(() => {
    return !this.loading() && this.filteredCampers().length === 0;
  });
  
  // Computed for showing range in pagination (used in template)
  showingRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.filteredCampers().length);
    return { start, end };
  });

  ngOnInit(): void {
    // Load all campers for admin
    this.loadCampers();
    
    // Subscribe to query params for filters from URL
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm.set(params['search']);
      }
      if (params['filter']) {
        this.filterByAge.set(params['filter']);
      }
    });
  }
  
  loadCampers(): void {
    console.log('👑 Admin: Loading all campers');
    this.camperService.getAllCampers().subscribe({
      next: (campers) => {
        this.camperService.campers.set(campers);
        console.log(`✅ Loaded ${campers.length} campers`);
      },
      error: (err) => {
        console.error('❌ Error loading campers:', err);
        this.camperService.error.set(err.error?.message || 'Failed to load campers');
      }
    });
  }
  
  // Age calculation
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
  
  // Pagination methods
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
  
  // Navigation methods
  viewCamper(camperId: string | undefined): void {
    if (camperId) {
      this.router.navigate(['/admin/campers/view', camperId]);
    }
  }
  
  editCamper(camperId: string | undefined): void {
    if (camperId) {
      this.router.navigate(['/admin/campers/edit', camperId]);
    }
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/admin/campers/new']);
  }
  
  navigateToRegistrations(camperId: string | undefined): void {
    if (camperId) {
      this.router.navigate(['/admin/registrations'], {
        queryParams: { camper: camperId }
      });
    }
  }
  
  // Delete operations
  promptDelete(camper: ICamper): void {
    this.selectedCamperForDelete.set(camper);
    this.showDeleteModal.set(true);
  }
  
  confirmDelete(): void {
    const camper = this.selectedCamperForDelete();
    if (!camper?._id) return;
    
    console.log('👑 Admin deleting camper:', camper._id);
    
    this.camperService.deleteAnyCamper(camper._id).subscribe({
      next: () => {
        // Remove camper from list
        this.camperService.removeCamperFromList(camper._id!);
        this.closeDeleteModal();
        console.log('✅ Camper deleted successfully');
      },
      error: (err) => {
        console.error('❌ Error deleting camper:', err);
        this.camperService.error.set(err.error?.message || 'Failed to delete camper');
        this.closeDeleteModal();
      }
    });
  }
  
  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedCamperForDelete.set(null);
  }
  
  // Clear filters
  clearFilters(): void {
    this.searchTerm.set('');
    this.filterByAge.set('');
    this.currentPage.set(1);
  }
  
  // Update filters (triggered from template)
  updateSearch(search: string): void {
    this.searchTerm.set(search);
    this.currentPage.set(1);
  }
  
  updateFilter(filter: string): void {
    this.filterByAge.set(filter);
    this.currentPage.set(1);
  }
  
  toggleSort(): void {
    this.sortAscending.update(value => !value);
  }
  
  // Refresh data
  refreshData(): void {
    this.loadCampers();
  }
  
  // Export data (if needed)
  exportData(): void {
    console.log('📤 Exporting campers data...');
    // You can implement CSV/Excel export here
    const data = this.filteredCampers();
    const csvContent = this.convertToCSV(data);
    this.downloadCSV(csvContent, 'campers.csv');
  }
  
  // Helper methods for CSV export
  private convertToCSV(data: any[]): string {
    const headers = ['Όνομα', 'Ηλικία', 'ΑΜΚΑ', 'Γονέας', 'Ηλικιακή Ομάδα', 'Ημερομηνία Δημιουργίας'];
    const rows = data.map(camper => [
      camper.fullName || '',
      this.calculateAge(camper.dateOfBirth),
      camper.amka || '',
      camper.parent || '',
      this.getAgeGroup(camper.dateOfBirth),
      camper.createdAt ? new Date(camper.createdAt).toLocaleDateString('el-GR') : ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  
  // View user profile
  viewUserProfile(userId: string | undefined): void {
    if (userId) {
      this.router.navigate(['/admin/users', userId]);
    }
  }

  // Helper to get age group count
  getAgeGroupCount(group: string): number {
    return this.campers().filter(camper => 
      this.getAgeGroup(camper.dateOfBirth) === group
    ).length;
  }

  // Get page numbers for pagination
  getPageNumbers(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: number[] = [];
    
    if (total <= 5) {
      // Show all pages
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show limited pages
      if (current <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (current >= total - 2) {
        pages.push(total - 4, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(current - 2, current - 1, current, current + 1, current + 2);
      }
    }
    
    return pages;
  }
  
  // Get registration count for a camper (you'll need to implement this based on your data)
  getRegistrationCount(camperId: string | undefined): number {
    // TODO: Implement this method based on your registration data
    return 0; // Placeholder
  }
}