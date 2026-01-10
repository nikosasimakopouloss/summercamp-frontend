import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildRegDatatable } from './child-reg-datatable';

describe('ChildRegDatatable', () => {
  let component: ChildRegDatatable;
  let fixture: ComponentFixture<ChildRegDatatable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildRegDatatable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChildRegDatatable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
