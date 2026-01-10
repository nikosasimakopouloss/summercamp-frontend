import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildRegTable } from './child-reg-table';

describe('ChildRegTable', () => {
  let component: ChildRegTable;
  let fixture: ComponentFixture<ChildRegTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildRegTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChildRegTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
