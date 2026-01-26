import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { ICamper, ICheckAmkaResponse } from '../interfaces/camper';

@Injectable({
  providedIn: 'root'
})
export class CamperService {
  private http = inject(HttpClient);

  // Signals
  campers = signal<ICamper[]>([]);
  currentCamper = signal<ICamper | null>(null);
  loading = signal<boolean>(false);
  error = signal<string>('');

  // User Operations
  createCamper(camper: ICamper) {
    this.loading.set(true);
    this.error.set('');
    
    return this.http.post<ICamper>(
      `${environment.apiUrl}/api/registrations/campers`, 
      camper
    );
  }

  getUserCampers() {
    this.loading.set(true);
    this.error.set('');
    
    return this.http.get<ICamper[]>(
      `${environment.apiUrl}/api/registrations/campers`
    );
  }

  loadUserCampers(): void {
    this.getUserCampers().subscribe({
      next: (campers) => {
        this.campers.set(campers);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to load campers');
        this.loading.set(false);
      }
    });
  }

  getCamper(id: string) {
    this.loading.set(true);
    this.error.set('');
    
    return this.http.get<ICamper>(
      `${environment.apiUrl}/api/registrations/campers/${id}`
    );
  }

  updateCamper(id: string, camper: ICamper) {
    this.loading.set(true);
    this.error.set('');
    
    return this.http.put<ICamper>(
      `${environment.apiUrl}/api/registrations/campers/${id}`, 
      camper
    );
  }

  deleteCamper(id: string) {
    this.loading.set(true);
    this.error.set('');
    
    return this.http.delete(
      `${environment.apiUrl}/api/registrations/campers/${id}`
    );
  }

  checkCamperAmka(amka: string) {
    return this.http.post<ICheckAmkaResponse>(
      `${environment.apiUrl}/api/registrations/campers/check-amka`, 
      { amka }
    );
  }

  // Admin Operations
  getAllCampers() {
    return this.http.get<ICamper[]>(
      `${environment.apiUrl}/api/registrations/admin/campers`
    );
  }

  deleteAnyCamper(id: string) {
    return this.http.delete(
      `${environment.apiUrl}/api/registrations/admin/campers/${id}`
    );
  }

  // Helper Methods
  setCurrentCamper(camper: ICamper): void {
    this.currentCamper.set(camper);
  }

  clearCurrentCamper(): void {
    this.currentCamper.set(null);
  }

  removeCamperFromList(id: string): void {
    const updatedCampers = this.campers().filter(camper => camper._id !== id);
    this.campers.set(updatedCampers);
  }

  addCamperToList(camper: ICamper): void {
    this.campers.update(campers => [...campers, camper]);
  }

  updateCamperInList(updatedCamper: ICamper): void {
    this.campers.update(campers => 
      campers.map(camper => 
        camper._id === updatedCamper._id ? updatedCamper : camper
      )
    );
  }
}