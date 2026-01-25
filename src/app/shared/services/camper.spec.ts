import { TestBed } from '@angular/core/testing';

import { CamperService } from './camper.service';

describe('Camper', () => {
  let service: CamperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CamperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
