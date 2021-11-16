//service to send data from table to varplot components
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataexchangeService {

  constructor() { }

  private subject = new Subject<any>();

  sendData(message: any) {
      this.subject.next(message);
  }

  getData(): Observable<any> {
      return this.subject.asObservable();
  }
}
