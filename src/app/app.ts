import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LogInPage } from './components/log-in-page/log-in-page';
import { CreateUser } from './components/create-user/create-user';

@Component({
  selector: 'app-root',
  imports: [
          RouterLink, 
          RouterOutlet, 
          LogInPage,
          CreateUser,
          
        
        ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('summercamp-frontend');

public name = "Nikos"


}
