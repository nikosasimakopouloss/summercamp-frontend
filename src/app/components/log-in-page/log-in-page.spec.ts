import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogInPage } from './log-in-page';

describe('LogInPage', () => {
  let component: LogInPage;
  let fixture: ComponentFixture<LogInPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogInPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogInPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
