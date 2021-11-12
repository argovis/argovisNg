import { TestBed } from '@angular/core/testing';

import { DataexchangeService } from './dataexchange.service';

describe('DataexchangeService', () => {
  let service: DataexchangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataexchangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
