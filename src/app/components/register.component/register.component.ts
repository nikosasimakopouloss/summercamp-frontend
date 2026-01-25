import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { IUser } from '../../shared/interfaces/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
   fb = inject(FormBuilder);
   userService = inject(UserService);
   router = inject(Router);
  
  registerForm: FormGroup;
  amkaChecking = false;
  
  constructor() {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      firstname: [''],
      lastname: [''],
      amka: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      email: ['', [Validators.email]],
      area: [''],
      street: [''],
      number: [''],
      po: [''],
      municipality: [''],
      phones: this.fb.array([])
    }, { validators: this.passwordMatchValidator });
    
    this.addPhone();
  }

  get phones() {
    return this.registerForm.get('phones') as FormArray;
  }

  addPhone(): void {
    const phoneGroup = this.fb.group({
      type: ['mobile', Validators.required],
      number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
    this.phones.push(phoneGroup);
  }

  removePhone(index: number): void {
    if (this.phones.length > 1) {
      this.phones.removeAt(index);
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  checkAmka(): void {
    const amka = this.registerForm.get('amka')?.value;
    if (amka && this.registerForm.get('amka')?.valid) {
      this.amkaChecking = true;
      
      this.userService.checkAmkaAvailable(amka).subscribe({
        next: (response) => {
          if (!response.available) {
            this.registerForm.get('amka')?.setErrors({ taken: true });
          }
          this.amkaChecking = false;
        },
        error: () => {
          this.amkaChecking = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const userData: IUser = {
        username: this.registerForm.value.username,
        password: this.registerForm.value.password,
        firstname: this.registerForm.value.firstname,
        lastname: this.registerForm.value.lastname,
        amka: this.registerForm.value.amka,
        email: this.registerForm.value.email,
        address: {
          area: this.registerForm.value.area,
          street: this.registerForm.value.street,
          number: this.registerForm.value.number,
          po: this.registerForm.value.po,
          municipality: this.registerForm.value.municipality
        },
        phone: this.registerForm.value.phones
      };
      
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.router.navigate(['/login'], { 
            queryParams: { registered: true } 
          });
        },
        error: (err) => {
          this.userService.setError(err.error?.message || 'Σφάλμα εγγραφής');
        }
      });
    }
  }
}