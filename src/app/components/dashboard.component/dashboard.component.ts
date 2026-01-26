import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { CamperService } from '../../shared/services/camper.service';
import { RegistrationService } from '../../shared/services/registration.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
   userService = inject(UserService);
  private camperService = inject(CamperService);
  private registrationService = inject(RegistrationService);
  
  ngOnInit(): void {
    if (this.userService.isLoggedIn()) {
      this.camperService.loadUserCampers();
      this.registrationService.loadUserRegistrations();
    }
  }

  get user() {
    return this.userService.user();
  }

  get isAdmin() {
    return this.userService.isAdmin();
  }

  get campersCount() {
    return this.camperService.campers().length;
  }

  get registrationsCount() {
    return this.registrationService.registrations().length;
  }

  get activeRegistrations() {
    return this.registrationService.registrations().filter(reg => reg.isActive).length;
  }

  logout(): void {
    this.userService.logoutUser();
  }
}