import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ChildRegForm } from '../child-reg-form/child-reg-form';

@Component({
  selector: 'app-user-view-menu',
  imports: [RouterLink, RouterLinkActive,RouterLink, RouterOutlet],
  templateUrl: './user-view-menu.html',
  styleUrl: './user-view-menu.css'
})
export class UserViewMenu {



  menu = [

  {text:"Child Registration", link: 'child-reg-form'},

  {text: "My Registrations", link: 'child-reg-table'},

  {text: "My Registrations Input", link: 'child-reg-table-input'}


  ]
  

}
