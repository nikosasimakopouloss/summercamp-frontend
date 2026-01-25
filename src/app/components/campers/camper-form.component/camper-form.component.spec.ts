import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamperFormComponent } from './camper-form.component';

describe('CamperFormComponent', () => {
  let component: CamperFormComponent;
  let fixture: ComponentFixture<CamperFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamperFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamperFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
