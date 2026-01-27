import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { IRegistration, IRegistrationResponse } from '../interfaces/registration';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private http = inject(HttpClient);

  // Signals
  registrations = signal<IRegistration[]>([]);
  registrationsResponse = signal<IRegistrationResponse[]>([]);
  currentRegistration = signal<IRegistration | null>(null);
  loading = signal<boolean>(false);
  error = signal<string>('');

  // User Operations
  createRegistration(registration: IRegistration) {
    this.loading.set(true);
    this.error.set('');
    
    return this.http.post<IRegistration>(
      `${environment.apiUrl}/api/registrations/registrations`, 
      registration
    );
  }

  getUserRegistrations() {
    this.loading.set(true);
    this.error.set('');
    
    return this.http.get<IRegistrationResponse[]>(
      `${environment.apiUrl}/api/registrations/registrations`
    );
  }

  loadUserRegistrations(): void {
    this.getUserRegistrations().subscribe({
      next: (registrationsResponse) => {
        this.registrationsResponse.set(registrationsResponse);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to load registrations');
        this.loading.set(false);
      }
    });
  }

  getRegistration(id: string) {
    this.loading.set(true);
    this.error.set('');
    
    return this.http.get<IRegistration>(
      `${environment.apiUrl}/api/registrations/registrations/${id}`
    );
  }

  deleteRegistration(id: string) {
    this.loading.set(true);
    this.error.set('');
    
    return this.http.delete(
      `${environment.apiUrl}/registrations/registrations/${id}`
    );
  }

  // Admin Operations
  getAllRegistrations() {
    return this.http.get<IRegistration[]>(
      `${environment.apiUrl}/api/registrations/admin/registrations`
    );
  }

  getRegistrationById(id: string) {
    return this.http.get<IRegistration>(
      `${environment.apiUrl}/api/registrations/admin/registrations/${id}`
    );
  }

  updateAnyRegistration(id: string, registration: IRegistration) {
    return this.http.put<IRegistration>(
      `${environment.apiUrl}/api/registrations/admin/registrations/${id}`, 
      registration
    );
  }

  deleteAnyRegistration(id: string) {
    return this.http.delete(
      `${environment.apiUrl}/api/registrations/admin/registrations/${id}`
    );
  }

  searchRegistrationsByAmka(amka: string) {
    return this.http.post<IRegistration[]>(
      `${environment.apiUrl}/api/registrations/admin/registrations/search`, 
      { amka }
    );
  }

  // Helper Methods
  setCurrentRegistration(registration: IRegistration): void {
    this.currentRegistration.set(registration);
  }

  clearCurrentRegistration(): void {
    this.currentRegistration.set(null);
  }

  removeRegistrationFromList(id: string): void {
    const updatedRegistrations = this.registrations().filter(reg => reg._id !== id);
    this.registrations.set(updatedRegistrations);
  }

  addRegistrationToList(registration: IRegistration): void {
    this.registrations.update(regs => [...regs, registration]);
  }

  updateRegistrationInList(updatedRegistration: IRegistration): void {
    this.registrations.update(registrations => 
      registrations.map(reg => 
        reg._id === updatedRegistration._id ? updatedRegistration : reg
      )
    );
  }
}