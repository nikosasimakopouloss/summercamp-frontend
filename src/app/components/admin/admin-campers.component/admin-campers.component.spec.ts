import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCampersComponent } from './admin-campers.component';

describe('AdminCampersComponent', () => {
  let component: AdminCampersComponent;
  let fixture: ComponentFixture<AdminCampersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCampersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCampersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
