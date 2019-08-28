import { TestBed } from '@angular/core/testing';

import { MapCovarService } from './map-covar.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('MapCovarService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  beforeEach(async() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ],
    providers: [ MapCovarService ],
  }));
  it('should be created', () => {
    const service: MapCovarService = TestBed.get(MapCovarService);
    expect(service).toBeTruthy();
  });
});
