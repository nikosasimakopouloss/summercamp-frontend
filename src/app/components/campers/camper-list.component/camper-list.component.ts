import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, takeUntil, map, catchError, of } from 'rxjs';

// Services
import { CamperService } from '../../../shared/services/camper.service';
import { UserService } from '../../../shared/services/user.service';

// Interfaces
import { ICamper } from '../../../shared/interfaces/camper';
import { ILoggedInUser } from '../../../shared/interfaces/user';

// Shared Components (optional - adjust based on what you have)
// import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-camper-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DatePipe,
    // LoadingSpinnerComponent
  ],
  templateUrl: './camper-list.component.html',
  styleUrls: ['./camper-list.component.css']
})
export class CamperListComponent implements OnInit {
  // Services
  private camperService = inject(CamperService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
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
  
  // Computed properties based on service signals
  campers = this.camperService.campers;
  loading = this.camperService.loading;
  error = this.camperService.error;
  currentUser = this.userService.user;
  
  // Check if user is admin
  isAdmin = computed(() => {
    const user = this.currentUser();
    return user?.roles?.includes('admin') || false;
  });
  
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
        camper.fullName?.toLowerCase().includes(search) ||
        camper.amka?.includes(search) ||
        (camper.additionalInfo?.toLowerCase().includes(search) || false)
      );
    }
    
    // Apply type filter
    if (filter) {
      campers = campers.filter(camper => camper.visitorType === filter);
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
  
  ngOnInit(): void {
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
    if (this.isAdmin()) {
      // For admin, we need to load all campers
      this.camperService.getAllCampers().subscribe({
        next: (campers) => {
          this.camperService.campers.set(campers);
        },
        error: (err) => {
          this.camperService.error.set(err.error?.message || 'Failed to load campers');
        }
      });
    } else {
      // For regular users, load their campers
      this.camperService.loadUserCampers();
    }
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
  editCamper(camperId: string | undefined): void {
    if (camperId) {
      this.router.navigate(['/campers/edit', camperId]);
    }
  }
  
  viewCamper(camperId: string | undefined): void {
    if (camperId) {
      this.router.navigate(['/campers', camperId]);
    }
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/campers/new']);
  }
  
  navigateToRegistrations(camperId: string | undefined): void {
    if (camperId) {
      this.router.navigate(['/registrations'], {
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
    
    const deleteObservable = this.isAdmin()
      ? this.camperService.deleteAnyCamper(camper._id)
      : this.camperService.deleteCamper(camper._id);
    
    deleteObservable.subscribe({
      next: () => {
        // Use the service helper method to remove from the list
        this.camperService.removeCamperFromList(camper._id!);
        this.closeDeleteModal();
      },
      error: (err) => {
        this.camperService.error.set(err.error?.message || 'Failed to delete camper');
        this.closeDeleteModal();
      }
    });
  }
  
  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedCamperForDelete.set(null);
  }
  
  // Permission checks
  canEditCamper(camper: ICamper): boolean {
    const user = this.currentUser();
    return this.isAdmin() || camper.parent === user?._id;
  }
  
  canDeleteCamper(camper: ICamper): boolean {
    return this.canEditCamper(camper);
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
}