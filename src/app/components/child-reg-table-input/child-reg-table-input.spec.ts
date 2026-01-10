import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildRegTableInput } from './child-reg-table-input';

describe('ChildRegTableInput', () => {
  let component: ChildRegTableInput;
  let fixture: ComponentFixture<ChildRegTableInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildRegTableInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChildRegTableInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
