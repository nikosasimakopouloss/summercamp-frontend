import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute, RouterOutlet } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

// Services
import { CamperService } from '../../../shared/services/camper.service';
import { UserService } from '../../../shared/services/user.service';

// Interfaces
import { ICamper } from '../../../shared/interfaces/camper';

@Component({
  selector: 'app-admin-camper-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    RouterOutlet,
    DatePipe
  ],
  templateUrl: './admin-camper-edit.component.html',
  styleUrls: [] // Reuse the same CSS
})
export class AdminCamperEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Services
  private fb = inject(FormBuilder);
  private camperService = inject(CamperService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  // Component state
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  error = signal<string>('');
  camperId = signal<string | null>(null);
  
  // Current camper
  currentCamper = signal<ICamper | null>(null);
  
  // Form group
  camperForm!: FormGroup;
  
  // Age-related computed values
  calculatedAge = computed(() => {
    const dob = this.camperForm.get('dateOfBirth')?.value;
    if (!dob) return 0;
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  });
  
  ageGroup = computed(() => {
    const age = this.calculatedAge();
    
    if (age < 6) return 'Preschool (0-5)';
    if (age < 13) return 'Child (6-12)';
    if (age < 18) return 'Teen (13-17)';
    return 'Adult (18+)';
  });
  
  // Visitor type options (same as your form)
  visitorTypes = [
    { value: 'Νέος κατασκηνωτής', label: 'Νέος κατασκηνωτής' },
    { value: 'Παλιός κατασκηνωτής', label: 'Παλιός κατασκηνωτής' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadCamperForEditing();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeForm(): void {
    this.camperForm = this.fb.group({
      fullName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      dateOfBirth: ['', [
        Validators.required,
        this.validateAge.bind(this)
      ]],
      amka: ['', [
        Validators.required,
        Validators.pattern(/^\d{11}$/),
        Validators.minLength(11),
        Validators.maxLength(11)
      ]],
      visitorType: ['child', Validators.required],
      additionalInfo: ['', Validators.maxLength(500)],
      healthDeclarationAccepted: [false, Validators.requiredTrue]
    });
    
    // Disable AMKA field in edit mode (AMKA shouldn't change)
    this.camperForm.get('amka')?.disable();
  }
  
  private loadCamperForEditing(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.error.set('Δεν βρέθηκε ID κατασκηνωτή');
      this.router.navigate(['/admin/dashboard/campers']);
      return;
    }
    
    this.camperId.set(id);
    this.loading.set(true);
    
    this.camperService.getCamper(id).subscribe({
      next: (camper) => {
        this.currentCamper.set(camper);
        this.populateForm(camper);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Αποτυχία φόρτωσης κατασκηνωτή');
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/admin/dashboard/campers']), 2000);
      }
    });
  }
  
  private populateForm(camper: ICamper): void {
    // Convert date string to YYYY-MM-DD format for date input
    const dateOfBirth = camper.dateOfBirth ? 
      new Date(camper.dateOfBirth).toISOString().split('T')[0] : '';
    
    this.camperForm.patchValue({
      fullName: camper.fullName || '',
      dateOfBirth: dateOfBirth,
      amka: camper.amka || '',
      visitorType: camper.visitorType || 'Νέος κατασκηνωτής',
      additionalInfo: camper.additionalInfo || '',
      healthDeclarationAccepted: camper.healthDeclarationAccepted || false
    });
  }
  
  // Custom validator for age
  private validateAge(control: any): { [key: string]: any } | null {
    if (!control.value) return null;
    
    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 0) return { futureDate: true };
    if (age > 120) return { invalidAge: true };
    
    return null;
  }
  
  // Form submission
  onSubmit(): void {
    if (this.camperForm.invalid || this.saving()) {
      return;
    }
    
    this.saving.set(true);
    this.error.set('');
    
    // Re-enable AMKA field for submission
    this.camperForm.get('amka')?.enable();
    
    const formValue = this.camperForm.value;
    const camperData: ICamper = {
      ...formValue,
      _id: this.camperId()!,
      parent: this.currentCamper()?.parent || '' // Keep the original parent
    };
    
    // Update camper
    this.camperService.updateCamper(this.camperId()!, camperData).subscribe({
      next: (updatedCamper) => {
        this.camperService.updateCamperInList(updatedCamper);
        this.saving.set(false);
        
        // Show success message and redirect
        alert('Ο κατασκηνωτής ενημερώθηκε επιτυχώς!');
        this.router.navigate(['/admin/dashboard/campers']);
      },
      error: (error) => {
        this.handleError(error, 'Αποτυχία ενημέρωσης κατασκηνωτή');
      }
    });
    
    // Disable AMKA field again
    this.camperForm.get('amka')?.disable();
  }
  
  private handleError(error: any, defaultMessage: string): void {
    this.error.set(error.error?.message || defaultMessage);
    this.saving.set(false);
  }
  
  // Form field getters for template convenience
  get fullName() { return this.camperForm.get('fullName'); }
  get dateOfBirth() { return this.camperForm.get('dateOfBirth'); }
  get amka() { return this.camperForm.get('amka'); }
  get visitorType() { return this.camperForm.get('visitorType'); }
  get additionalInfo() { return this.camperForm.get('additionalInfo'); }
  get healthDeclarationAccepted() { return this.camperForm.get('healthDeclarationAccepted'); }
  
  // Cancel/back navigation
  onCancel(): void {
    this.router.navigate(['/admin/dashboard/campers']);
  }
  
  // Calculate max date for date picker (today)
  get maxDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  // Calculate min date for date picker (120 years ago)
  get minDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 120);
    return date.toISOString().split('T')[0];
  }
}