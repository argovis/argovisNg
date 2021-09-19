import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ARShape } from '../models/ar-shape'
import { environment } from '../../environments/environment';
import * as moment from 'moment';
import { mockShapeComplex } from './ar-shape.parameters'
@Injectable({
  providedIn: 'root'
})

export class ArShapeService {

  private mockShapeComplex: ARShape = mockShapeComplex

  constructor(private http: HttpClient) { }

  public get_mock_shape(date: moment.Moment): Observable<ARShape[]> {
    return of([this.mockShapeComplex])
  }

  public get_ar_shapes(dateString: string): Observable<ARShape[]> {
    let url = environment.apiRoot
    url += '/arShapes/findByDate?date='+dateString;
    return this.http.get<ARShape[]>(url)
  }

}
