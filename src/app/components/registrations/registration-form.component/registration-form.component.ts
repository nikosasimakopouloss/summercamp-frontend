import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, map } from 'rxjs';

// Services
import { RegistrationService } from '../../../shared/services/registration.service';
import { CamperService } from '../../../shared/services/camper.service';
import { UserService } from '../../../shared/services/user.service';

// Interfaces
import { IRegistration } from '../../../shared/interfaces/registration';
import { ICamper } from '../../../shared/interfaces/camper';

@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe
  ],
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.css']
})
export class RegistrationFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Services
  private fb = inject(FormBuilder);
  private registrationService = inject(RegistrationService);
  private camperService = inject(CamperService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  // Component state
  isEditMode = signal<boolean>(false);
  registrationId = signal<string | null>(null);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  error = signal<string>('');
  
  // Data
  campers = signal<ICamper[]>([]);
  currentRegistration = this.registrationService.currentRegistration;
  
  // Camp options
  // Fix the campTypes - Use exact Greek values
campTypes = signal([
  { value: 'Η Φωλιά του Παιδιού', label: 'Η Φωλιά του Παιδιού' },
  { value: 'Ο Παράδεισος του Παιδιού', label: 'Ο Παράδεισος του Παιδιού' }
]);
  
  // Camp periods (would typically come from API)
  campPeriods = signal([
  { value: "A' (16/6 - 30/6)", label: "A' (16/6 - 30/6)" },
  { value: "B' (17/7 - 15/7)", label: "B' (17/7 - 15/7)" },
  { value: "Γ' (16/7 - 30/7)", label: "Γ' (16/7 - 30/7)" },
  { value: "Δ' (31/7 - 14/8) Μόνο για την Φωλιά", label: "Δ' (31/7 - 14/8) Μόνο για την Φωλιά" },
  { value: "E' (17/8 - 31/8) Μόνο για την Φωλιά", label: "E' (17/8 - 31/8) Μόνο για την Φωλιά" }
]);



filteredCampPeriods = signal<any[]>([]);


// Add beneficiary types
beneficiaryTypes = signal([
  { value: 'Μητέρα', label: 'Μητέρα' },
  { value: 'Πατέρας', label: 'Πατέρας' }
]);








  
  // Form group
  registrationForm!: FormGroup;
  
  // Computed values
  selectedCamper = computed(() => {
    const camperId = this.registrationForm.get('camper')?.value;
    if (!camperId) return null;
    return this.campers().find(c => c._id === camperId);
  });
  
  selectedCampType = computed(() => {
    return this.registrationForm.get('campType')?.value;
  });
  
  isFormValid = computed(() => {
    return this.registrationForm.valid && this.registrationForm.get('camper')?.value;
  });
  
  ngOnInit(): void {
    this.initializeForm();
    this.loadCampers();
    this.checkMode();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.registrationService.clearCurrentRegistration();
  }
  
  private initializeForm(): void {
    this.registrationForm = this.fb.group({
      camper: ['', Validators.required],
      campType: ['Η Φωλιά του Παιδιού', Validators.required],
      campPeriod: [this.campPeriods()[0]?.value || '', Validators.required],
      
      beneficiary: ['Μητέρα', Validators.required], // Default to mother


      motherName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      fatherName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      socialSecurityFund: ['', Validators.maxLength(50)],
      registrationDate: [this.getTodayDate(), Validators.required],
      isActive: [true],
      notes: ['', Validators.maxLength(500)]
    });
    
    // Auto-fill beneficiary when camper is selected
    this.registrationForm.get('camper')?.valueChanges.subscribe(camperId => {
      if (camperId) {
        const camper = this.campers().find(c => c._id === camperId);
        if (camper && !this.isEditMode()) {
          this.registrationForm.patchValue({
            // beneficiary: camper.fullName || '',
            motherName: '',
            fatherName: ''
          });
        }
      }
    });
    
    // Filter camp periods based on selected camp type
    this.registrationForm.get('campType')?.valueChanges.subscribe(campType => {
      this.filterCampPeriods(campType);
    });
  }
  
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  private filterCampPeriods(campType: string): void {
    // In a real app, you'd fetch periods from API based on campType
    // For now, we'll just enable all periods
    // this.registrationForm.get('campPeriod')?.enable();

    let filteredPeriods = this.campPeriods();
  
  if (campType === 'Ο Παράδεισος του Παιδιού') {
    // Only show periods available for Παράδεισος
    filteredPeriods = this.campPeriods().filter(period => 
      !period.value.includes('Μόνο για την Φωλιά')
    );
  }
  
  // Update available periods
  // You might need to create a signal for filtered periods
  this.filteredCampPeriods.set(filteredPeriods);
  
  // If current campPeriod is not in filtered list, reset it
  const currentPeriod = this.registrationForm.get('campPeriod')?.value;
  if (currentPeriod && !filteredPeriods.some(p => p.value === currentPeriod)) {
    this.registrationForm.patchValue({
      campPeriod: filteredPeriods[0]?.value || ''
    });
  }



  }
  
  private loadCampers(): void {
    this.loading.set(true);
    
    // Load parent's campers
    this.camperService.getUserCampers().subscribe({
      next: (campers) => {
        this.campers.set(campers);
        
        // If there's only one camper, auto-select it in create mode
        if (campers.length === 1 && !this.isEditMode()) {
          this.registrationForm.patchValue({ camper: campers[0]._id });
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load campers: ' + (error.error?.message || error.message));
        this.loading.set(false);
      }
    });
  }
  
  private checkMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.isEditMode.set(true);
      this.registrationId.set(id);
      this.loadRegistrationForEditing(id);
    } else {
      this.isEditMode.set(false);
    }
  }
  
  private loadRegistrationForEditing(id: string): void {
    this.loading.set(true);
    
    this.registrationService.getRegistration(id).subscribe({
      next: (registration) => {
        this.registrationService.setCurrentRegistration(registration);
        this.populateForm(registration);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to load registration');
        this.loading.set(false);
        this.router.navigate(['/registrations']);
      }
    });
  }
  
  private populateForm(registration: IRegistration): void {
    // Convert registration date to YYYY-MM-DD format
    const registrationDate = registration.registrationDate ? 
      new Date(registration.registrationDate).toISOString().split('T')[0] : 
      this.getTodayDate();
    
    this.registrationForm.patchValue({
      camper: registration.camper || '',
      campType: registration.campType || 'summer',
      campPeriod: registration.campPeriod || '',
      beneficiary: registration.beneficiary || '',
      motherName: registration.motherName || '',
      fatherName: registration.fatherName || '',
      socialSecurityFund: registration.socialSecurityFund || '',
      registrationDate: registrationDate,
      isActive: registration.isActive !== undefined ? registration.isActive : true,
      notes: registration.notes || ''
    });
    
    // Disable camper field in edit mode (can't change camper after registration)
    this.registrationForm.get('camper')?.disable();
  }
  
  // Form submission
  onSubmit(): void {
    if (this.registrationForm.invalid || this.saving()) {
      return;
    }
    
    // Re-enable disabled fields for submission
    if (this.isEditMode()) {
      this.registrationForm.get('camper')?.enable();
    }
    
    this.saving.set(true);
    this.error.set('');
    
    const formValue = this.registrationForm.value;
    const registrationData: IRegistration = {
      ...formValue,
      user: this.userService.getCurrentUserId() || '',
      registrationDate: new Date(formValue.registrationDate).toISOString()
    };
    
    if (this.isEditMode() && this.registrationId()) {
      // Update existing registration
      this.registrationService.deleteRegistration(this.registrationId()!).subscribe({
        next: () => {
          this.registrationService.removeRegistrationFromList(this.registrationId()!);
          this.createNewRegistration(registrationData);
        },
        error: (error) => {
          this.handleError(error, 'Failed to update registration');
        }
      });
    } else {
      // Create new registration
      this.createNewRegistration(registrationData);
    }
    
    // Disable camper field again if in edit mode
    if (this.isEditMode()) {
      this.registrationForm.get('camper')?.disable();
    }
  }
  
  private createNewRegistration(registrationData: IRegistration): void {
    this.registrationService.createRegistration(registrationData).subscribe({
      next: (newRegistration) => {
        if (this.isEditMode()) {
          // In edit mode, we deleted the old one, so add the new one
          this.registrationService.addRegistrationToList(newRegistration);
        } else {
          this.registrationService.addRegistrationToList(newRegistration);
        }
        this.handleSuccess(
          this.isEditMode() 
            ? 'Registration updated successfully!' 
            : 'Registration created successfully!'
        );
      },
      error: (error) => {
        this.handleError(error, 'Failed to create registration');
      }
    });
  }
  
  private handleSuccess(message: string): void {
    this.saving.set(false);
    this.router.navigate(['/registrations'], {
      queryParams: { success: message }
    });
  }
  
  private handleError(error: any, defaultMessage: string): void {
    this.error.set(error.error?.message || defaultMessage);
    this.saving.set(false);
  }
  
  // Form field getters
  get camper() { return this.registrationForm.get('camper'); }
  get campType() { return this.registrationForm.get('campType'); }
  get campPeriod() { return this.registrationForm.get('campPeriod'); }
  get beneficiary() { return this.registrationForm.get('beneficiary'); }
  get motherName() { return this.registrationForm.get('motherName'); }
  get fatherName() { return this.registrationForm.get('fatherName'); }
  get socialSecurityFund() { return this.registrationForm.get('socialSecurityFund'); }
  get registrationDate() { return this.registrationForm.get('registrationDate'); }
  get isActive() { return this.registrationForm.get('isActive'); }
  get notes() { return this.registrationForm.get('notes'); }




// Helper to get camp period value from label or vice versa
getCampPeriodValue(label: string): string {
  const period = this.campPeriods().find(p => p.label === label);
  return period?.value || '';
}

getCampPeriodLabel(value: string): string {
  const period = this.campPeriods().find(p => p.value === value);
  return period?.label || '';
}










  
  // Validation helpers
  getCamperName(camperId: string): string {
    const camper = this.campers().find(c => c._id === camperId);
    return camper?.fullName || 'Unknown Camper';
  }
  
  // Calculate camper age
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
  
  // Cancel/back navigation
  onCancel(): void {
    this.router.navigate(['/registrations']);
  }
  
  // Check if camper already has a registration for selected period
  checkCamperAvailability(): boolean {
    const camperId = this.camper?.value;
    const period = this.campPeriod?.value;
    
    if (!camperId || !period) return true;
    
    // In a real app, you'd check with API
    // For now, assume available
    return true;
  }
  
  // Get camp periods filtered by type
  getFilteredCampPeriods(): any[] {
    const type = this.selectedCampType();
    // In a real app, filter periods by type
    return this.campPeriods();
  }



getFormControlsArray(): Array<{name: string, value: any, valid: boolean, errors: any}> {
  const controls = [];
  for (const [name, control] of Object.entries(this.registrationForm.controls)) {
    controls.push({
      name,
      value: control.value,
      valid: control.valid,
      errors: control.errors
    });
  }
  return controls;
}









}