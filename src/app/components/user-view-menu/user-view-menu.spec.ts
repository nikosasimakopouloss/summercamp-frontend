import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserViewMenu } from './user-view-menu';

describe('UserViewMenu', () => {
  let component: UserViewMenu;
  let fixture: ComponentFixture<UserViewMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserViewMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserViewMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
