import { TestBed } from '@angular/core/testing';
import { GetProfilesService } from './get-profiles.service';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, HttpClientModule, HttpHandler } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from '../../environments/environment';

describe('GetProfilesService', () => {
  let service: GetProfilesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpClientTestingModule, 
        HttpTestingController, 
        HttpClient, 
        HttpClientModule, 
        HttpHandler, ],
    });
    service = TestBed.inject(GetProfilesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle queries with no BGC variables correctly', () => {
    expect(service.construct_platform_query('1234', ['latitude', 'longitude', 'time'])).toEqual(environment.apiRoot + '/profiles?platforms=1234&bgcMeasurements=pres')
  })
});
