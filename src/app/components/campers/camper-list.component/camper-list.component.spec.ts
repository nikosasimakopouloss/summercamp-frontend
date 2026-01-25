import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamperListComponent } from './camper-list.component';

describe('CamperListComponent', () => {
  let component: CamperListComponent;
  let fixture: ComponentFixture<CamperListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamperListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamperListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
