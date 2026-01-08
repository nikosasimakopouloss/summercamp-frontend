import { Component } from '@angular/core';
import { MatFormField, MatLabel, MatError, MatInput } from "@angular/material/input";
import { MatAnchor } from '@angular/material/button';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'log-in-page',
  imports: [MatError, MatFormField, MatLabel, MatInput, MatAnchor, ReactiveFormsModule],
  templateUrl: './log-in-page.html',
  styleUrl: './log-in-page.css',
})
export class LogInPage {

  form = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)

})

onSubmit(){
    console.log(this.form.value);

}

}
