import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { IUser } from '../../shared/interfaces/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
   fb = inject(FormBuilder);
   userService = inject(UserService);
   router = inject(Router);
  
  profileForm: FormGroup;
  isEditing = false;
  userId: string | null = null;

  constructor() {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstname: [''],
      lastname: [''],
      email: ['', [Validators.email]],
      amka: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      area: [''],
      street: [''],
      number: [''],
      po: [''],
      municipality: [''],
      phones: this.fb.array([])
    });
  }

  ngOnInit(): void {
    const user = this.userService.user();
    this.userId = user?._id || null;
    
    if (this.userId) {
      this.loadUserData();
    }
  }

  get phones() {
    return this.profileForm.get('phones') as FormArray;
  }

  addPhone(): void {
    const phoneGroup = this.fb.group({
      type: ['mobile', Validators.required],
      number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
    this.phones.push(phoneGroup);
  }

  removePhone(index: number): void {
    this.phones.removeAt(index);
  }

  loadUserData(): void {
    if (!this.userId) return;

    this.userService.getUser(this.userId).subscribe({
      next: (user) => {
        this.profileForm.patchValue({
          username: user.username,
          firstname: user.firstname || '',
          lastname: user.lastname || '',
          email: user.email || '',
          amka: user.amka,
          area: user.address?.area || '',
          street: user.address?.street || '',
          number: user.address?.number || '',
          po: user.address?.po || '',
          municipality: user.address?.municipality || ''
        });

        // Clear existing phones
        while (this.phones.length) {
          this.phones.removeAt(0);
        }

        // Add phones from user data
        if (user.phone && user.phone.length > 0) {
          user.phone.forEach(phone => {
            const phoneGroup = this.fb.group({
              type: [phone.type, Validators.required],
              number: [phone.number, [Validators.required, Validators.pattern(/^\d{10}$/)]]
            });
            this.phones.push(phoneGroup);
          });
        } else {
          this.addPhone();
        }

        this.profileForm.disable();
      },
      error: (err) => {
        this.userService.setError('Αδυναμία φόρτωσης προφίλ');
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    
    if (this.isEditing) {
      this.profileForm.enable();
      // Keep amka disabled (shouldn't be changed)
      this.profileForm.get('amka')?.disable();
    } else {
      this.profileForm.disable();
      this.loadUserData();
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid && this.userId) {
      const userData: Partial<IUser> = {
        username: this.profileForm.value.username,
        firstname: this.profileForm.value.firstname,
        lastname: this.profileForm.value.lastname,
        email: this.profileForm.value.email,
        address: {
          area: this.profileForm.value.area,
          street: this.profileForm.value.street,
          number: this.profileForm.value.number,
          po: this.profileForm.value.po,
          municipality: this.profileForm.value.municipality
        },
        phone: this.profileForm.value.phones
      };

      this.userService.updateUser(this.userId, userData).subscribe({
        next: (updatedUser) => {
          // Update local user data
          const currentUser = this.userService.user();
          if (currentUser) {
            this.userService.user.set({
              ...currentUser,
              username: updatedUser.username,
              email: updatedUser.email,
              firstname: updatedUser.firstname,
              lastname: updatedUser.lastname
            });
          }
          
          this.isEditing = false;
          this.profileForm.disable();
          this.userService.clearError();
        },
        error: (err) => {
          this.userService.setError(err.error?.message || 'Σφάλμα ενημέρωσης');
        }
      });
    }
  }

  deleteAccount(): void {
    if (confirm('Είστε σίγουρος ότι θέλετε να διαγράψετε τον λογαριασμό σας; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.') && this.userId) {
      this.userService.deleteUser(this.userId).subscribe({
        next: () => {
          this.userService.logoutUser();
          this.router.navigate(['/login'], { 
            queryParams: { deleted: true } 
          });
        },
        error: (err) => {
          this.userService.setError(err.error?.message || 'Σφάλμα διαγραφής');
        }
      });
    }
  }
}