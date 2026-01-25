import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UserService } from './shared/services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'summer-camp-registration';

  get isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  get isAdmin() {
    return this.userService.isAdmin();
  }

  constructor(private userService: UserService) {}

  logout() {
    this.userService.logoutUser();
  }
}