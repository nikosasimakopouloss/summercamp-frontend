import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildRegTableForDirective } from './child-reg-table-for-directive';

describe('ChildRegTableForDirective', () => {
  let component: ChildRegTableForDirective;
  let fixture: ComponentFixture<ChildRegTableForDirective>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildRegTableForDirective]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChildRegTableForDirective);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
