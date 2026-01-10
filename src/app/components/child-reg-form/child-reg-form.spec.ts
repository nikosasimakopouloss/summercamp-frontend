import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildRegForm } from './child-reg-form';

describe('ChildRegForm', () => {
  let component: ChildRegForm;
  let fixture: ComponentFixture<ChildRegForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildRegForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChildRegForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
