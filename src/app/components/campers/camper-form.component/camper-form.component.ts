import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

// Services
import { CamperService } from '../../../shared/services/camper.service';
import { UserService } from '../../../shared/services/user.service';

// Interfaces
import { ICamper } from '../../../shared/interfaces/camper';

@Component({
  selector: 'app-camper-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe
  ],
  templateUrl: './camper-form.component.html',
  styleUrls: ['./camper-form.component.css']
})
export class CamperFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Services
  private fb = inject(FormBuilder);
  private camperService = inject(CamperService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  // Component state
  isEditMode = signal<boolean>(false);
  camperId = signal<string | null>(null);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  error = signal<string>('');
  amkaChecking = signal<boolean>(false);
  amkaAvailable = signal<boolean | null>(null);
  
  // Current camper for edit mode
  currentCamper = this.camperService.currentCamper;
  
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
  
  // Visitor type options
  // visitorTypes = [
  //   { value: 'child', label: 'Child (6-12 years)' },
  //   { value: 'teen', label: 'Teen (13-17 years)' },
  //   { value: 'adult', label: 'Adult (18+ years)' }
  // ];
  
visitorTypes = [
{ value: 'Νέος κατασκηνωτής', label: 'Νέος κατασκηνωτής' },
{ value: 'Παλιός κατασκηνωτής', label: 'Παλιός κατασκηνωτής' }
];






  ngOnInit(): void {
    this.initializeForm();
    this.checkMode();
    this.setupAmkaValidation();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.camperService.clearCurrentCamper();
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
        Validators.pattern(/^\d{11}$/), // Assuming 11-digit AMKA
        Validators.minLength(11),
        Validators.maxLength(11)
      ]],
      visitorType: ['child', Validators.required],
      additionalInfo: ['', Validators.maxLength(500)],
      healthDeclarationAccepted: [false, Validators.requiredTrue]
    });
    
    // Update visitor type based on calculated age
    this.camperForm.get('dateOfBirth')?.valueChanges.subscribe(() => {
      if (!this.isEditMode()) {
        this.updateVisitorTypeBasedOnAge();
      }
    });
  }
  
  private checkMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.isEditMode.set(true);
      this.camperId.set(id);
      this.loadCamperForEditing(id);
    } else {
      this.isEditMode.set(false);
    }
  }
  
  private loadCamperForEditing(id: string): void {
    this.loading.set(true);
    
    this.camperService.getCamper(id).subscribe({
      next: (camper) => {
        this.camperService.setCurrentCamper(camper);
        this.populateForm(camper);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to load camper');
        this.loading.set(false);
        this.router.navigate(['/campers']);
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
      visitorType: camper.visitorType || 'child',
      additionalInfo: camper.additionalInfo || '',
      healthDeclarationAccepted: camper.healthDeclarationAccepted || false
    });
    
    // Disable AMKA field in edit mode (AMKA shouldn't change)
    this.camperForm.get('amka')?.disable();
  }
  
  private setupAmkaValidation(): void {
    // Only check AMKA availability in create mode
    if (!this.isEditMode()) {
      this.camperForm.get('amka')?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(amka => {
        if (this.camperForm.get('amka')?.valid && amka.length === 11) {
          this.checkAmkaAvailability(amka);
        } else {
          this.amkaAvailable.set(null);
        }
      });
    }
  }
  
  private checkAmkaAvailability(amka: string): void {
    this.amkaChecking.set(true);
    
    this.camperService.checkCamperAmka(amka).subscribe({
      next: (response) => {
        this.amkaAvailable.set(response.available);
        this.amkaChecking.set(false);
      },
      error: () => {
        this.amkaAvailable.set(null);
        this.amkaChecking.set(false);
      }
    });
  }
  
  private updateVisitorTypeBasedOnAge(): void {
    const age = this.calculatedAge();
    let visitorType = 'child';
    
    if (age >= 18) {
      visitorType = 'adult';
    } else if (age >= 13) {
      visitorType = 'teen';
    } else if (age >= 6) {
      visitorType = 'child';
    } else {
      visitorType = 'child'; // Default for young children
    }
    
    this.camperForm.get('visitorType')?.setValue(visitorType);
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
    
    // Camp typically for ages 6-17, but we'll allow adults too
    if (age < 0) {
      return { futureDate: true };
    }
    
    if (age > 120) {
      return { invalidAge: true };
    }
    
    return null;
  }
  
  // Form submission
  onSubmit(): void {
    if (this.camperForm.invalid || this.saving()) {
      return;
    }
    
    // Re-enable AMKA field for submission if it's disabled
    if (this.isEditMode()) {
      this.camperForm.get('amka')?.enable();
    }
    
    this.saving.set(true);
    this.error.set('');
    
    const formValue = this.camperForm.value;
    const camperData: ICamper = {
      ...formValue,
      parent: this.userService.getCurrentUserId() || ''
    };
    
    if (this.isEditMode() && this.camperId()) {
      // Update existing camper
      this.camperService.updateCamper(this.camperId()!, camperData).subscribe({
        next: (updatedCamper) => {
          this.camperService.updateCamperInList(updatedCamper);
          this.handleSuccess('Camper updated successfully!');
        },
        error: (error) => {
          this.handleError(error, 'Failed to update camper');
        }
      });
    } else {
      // Create new camper
      this.camperService.createCamper(camperData).subscribe({
        next: (newCamper) => {
          this.camperService.addCamperToList(newCamper);
          this.handleSuccess('Camper created successfully!');
        },
        error: (error) => {
          this.handleError(error, 'Failed to create camper');
        }
      });
    }
    
    // Disable AMKA field again if in edit mode
    if (this.isEditMode()) {
      this.camperForm.get('amka')?.disable();
    }
  }
  
  private handleSuccess(message: string): void {
    this.saving.set(false);
    this.router.navigate(['/dashboard/registrations/new'], {
      queryParams: { success: message }
    });
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
  
  // Validation helpers
  getAmkaStatusClass(): string {
    if (this.amkaChecking()) return 'checking';
    if (this.amkaAvailable() === true) return 'available';
    if (this.amkaAvailable() === false) return 'unavailable';
    return '';
  }
  
  getAmkaStatusMessage(): string {
    if (this.amkaChecking()) return 'Checking AMKA availability...';
    if (this.amkaAvailable() === true) return 'AMKA is available';
    if (this.amkaAvailable() === false) return 'AMKA is already registered';
    return '';
  }
  
  // Cancel/back navigation
  onCancel(): void {
    this.router.navigate(['/campers']);
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