import { Component, inject } from '@angular/core';
// import { UserService } from '../../shared/services/user.service';
import { 
  FormArray, 
  FormControl, 
  FormGroup, 
  AbstractControl, 
  ReactiveFormsModule, 
  Validators 
} from '@angular/forms';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import {IUser} from '../../shared/interfaces/user';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'create-user',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './create-user.html',
  styleUrl: 'create-user.css',
})
export class CreateUser {
  // userService = inject(UserService);

  registrationStatus: {success: boolean, message:string} = {
    success: false,
    message: "Not attempted yet"
  }

  form = new FormGroup({
    username: new FormControl('', Validators.required),
    firstname: new FormControl(''),
    lastname: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(5)]),
    confirmPassword: new FormControl('', [Validators.required, Validators.minLength(5)]),
    address: new FormGroup({
      area: new FormControl(''),
      street: new FormControl('')
    }),
    phone: new FormArray([
      new FormGroup({
        number: new FormControl('', Validators.required),
        type: new FormControl('', Validators.required)
      })
    ])

  },

  this.passwordConfirmPasswordValidator

  )

  passwordConfirmPasswordValidator(control: AbstractControl):{[key:string]:boolean} | null {
    const form = control as FormGroup;
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password && confirmPassword && password!== confirmPassword){
      form.get('confirmPassword')?.setErrors({passwordMismatch: true});
      return {passwordMismatch: true}
    }

    return null
  }


  phone = this.form.get('phone') as FormArray;
  


addPhoneNumber(){
    this.phone.push(
      new FormGroup({
        number: new FormControl('', Validators.required),
        type: new FormControl('', Validators.required)
      })
    )
  }


  deletePhoneNumber(index:number){
    this.phone.removeAt(index);
  }



  onSubmit(){
    console.log(this.form.value);

    
  }



  } 




