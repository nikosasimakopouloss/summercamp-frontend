import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCamperEditComponent } from './admin-camper-edit.component';

describe('AdminCamperEditComponent', () => {
  let component: AdminCamperEditComponent;
  let fixture: ComponentFixture<AdminCamperEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCamperEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCamperEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
