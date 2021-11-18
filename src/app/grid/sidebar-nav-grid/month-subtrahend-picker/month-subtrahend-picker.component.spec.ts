import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { MonthSubtrahendPickerComponent } from './month-subtrahend-picker.component'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { MaterialModule } from './../../../material/material.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { DebugElement } from '@angular/core'; //can view dom elements with this
import { QueryGridService } from './../../query-grid.service'
import {FormControl} from '@angular/forms'
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import * as moment from 'moment'

describe('MonthSubtrahendPickerComponent', () => {
  let component: MonthSubtrahendPickerComponent;
  let fixture: ComponentFixture<MonthSubrahendPickerComponent>;
  let debugElement: DebugElement;
  let queryGridService: QueryGridService;
  let spyGetDate: jasmine.Spy;
  let spySendDate: jasmine.Spy;
  let spy: jasmine.Spy;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthSubtrahendPickerComponent ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      imports: [ MaterialModule, FormsModule, ReactiveFormsModule, RouterTestingModule, BrowserAnimationsModule, HttpClientTestingModule ],
      providers: [ QueryGridService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthSubtrahendPickerComponent)
    component = fixture.componentInstance
    component.paramMode = true
    debugElement = fixture.debugElement

    queryGridService = debugElement.injector.get(QueryGridService)

    spySendDate = spyOn(queryGridService, 'sendDate').and.callThrough()
    spyGetDate = spyOn(queryGridService, 'getDate').and.callThrough()
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(spyGetDate).toHaveBeenCalledTimes(1)
  });

  it('should set date to today', () => {
    const ddate = moment()
    const date = new FormControl(ddate)
    const cDate = component['dateForm']
    expect(cDate.value.format('YYYY-MM-DD')).toEqual(ddate.format('YYYY-MM-DD'))
  });

  it('should increment Month', () => {

    component['increment'](1)

    let mys = '2012-02-01'
    expect(component['date'].format('YYYY-MM-DD')).toEqual(mys)
    let cDate = component['dateForm']
    expect(cDate.value.format('YYYY-MM-DD')).toEqual(mys)

    component['increment'](-1)
    mys = moment('2012-01-01', 'YYYY-MM-DD').utc(false).format('YYYY-MM-DD')
    expect(component['date'].format('YYYY-MM-DD')).toEqual(mys)
    cDate = component['dateForm']
    expect(cDate.value.format('YYYY-MM-DD')).toEqual(mys)

    component['increment'](-1)
    mys = moment('2011-12-01', 'YYYY-MM-DD').utc(false).format('YYYY-MM-DD')
    expect(component['date'].format('YYYY-MM-DD')).toEqual(mys)
    cDate = component['dateForm']
    expect(cDate.value.format('YYYY-MM-DD')).toEqual(mys)

    expect(spySendDate).toHaveBeenCalledTimes(3)  //somehow service is getting rewritten before message is called
    expect(spyGetDate).toHaveBeenCalledTimes(1)
  });

  it('should sendDate', () => {
    component['sendDate']()
    expect(spySendDate).toHaveBeenCalledTimes(1)
  });

  it('should chosenYearHandler', () => {
    const year = 2018
    component['chosenYearHandler'](year)
    expect(component['date'].year()).toEqual(year);
    expect(spySendDate).toHaveBeenCalledTimes(1)
  });

  it('should chosenMonthHandler', () => {
    const month = 6

    component['chosenMonthHandler'](month)
    expect(component['date'].month()).toEqual(month)
    expect(spySendDate).toHaveBeenCalledTimes(1)
  });

  it('should displaydate_changed', () => {
    const mys = moment('2015-11-01', 'YYYY-MM-DD').utc(false)
    component['displaydate_changed'](mys)
    expect(component['date'].format('YYYY-MM-DD')).toEqual(mys.format('YYYY-MM-DD'))
    expect(spySendDate).toHaveBeenCalledTimes(1)
  });

});
