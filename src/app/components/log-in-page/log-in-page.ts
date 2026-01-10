import { Component } from '@angular/core';
import { MatFormField, MatLabel, MatError, MatInput } from "@angular/material/input";
import { MatAnchor } from '@angular/material/button';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterModule, RouterOutlet } from "@angular/router";

@Component({
  selector: 'log-in-page',
  imports: [MatError, MatFormField, MatLabel, MatInput, MatAnchor, ReactiveFormsModule, RouterLink, RouterOutlet,RouterModule],
  templateUrl: './log-in-page.html',
  styleUrl: './log-in-page.css',
})
export class LogInPage {

  
 constructor(private router: Router) {}

  form = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)

})

onSubmit(){
    console.log(this.form.value);

}


 goToCreateAccount() {
    this.router.navigate(['/create-user']);
  }


  goToUserViewMenu() {
    this.router.navigate(['/user-view-menu']);
  }





}
