import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildRegDatatableShow } from './child-reg-datatable-show';

describe('ChildRegDatatableShow', () => {
  let component: ChildRegDatatableShow;
  let fixture: ComponentFixture<ChildRegDatatableShow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildRegDatatableShow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChildRegDatatableShow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
