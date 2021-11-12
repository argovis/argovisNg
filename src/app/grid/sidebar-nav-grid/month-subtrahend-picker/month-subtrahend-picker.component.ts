import { Component, OnInit, Input, ViewChild, Injector } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { FormControl } from '@angular/forms';
import { MomentDateAdapter} from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { SelectGridService } from './../../select-grid.service'
import { GridMeta } from './../../../../typeings/grids'
import { QueryGridService } from '../../query-grid.service'

import * as moment from 'moment';

export const MONTH_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-month-subtrahend-picker',
  templateUrl: './month-subtrahend-picker.component.html',
  styleUrls: ['./month-subtrahend-picker.component.css'],
  providers: [
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MONTH_FORMATS},
  ],
})
export class MonthSubtrahendPickerComponent implements OnInit {

  public monthPicker: boolean = true
  public inc: number = 1
  public dateForm = new FormControl(moment());
  public date: moment.Moment;
  public minDate: Date
  public maxDate: Date
  @Input() paramMode: boolean
  public dates: string[]
  @ViewChild('dp') datepicker: MatDatepicker<any>;
  public queryGridService: QueryGridService
  public selectGridService: SelectGridService

  constructor(public injector: Injector) {
    this.queryGridService = injector.get(QueryGridService)
    this.selectGridService = injector.get(SelectGridService)
  }

  ngOnInit() {
    this.date = this.queryGridService.getDate()
    this.queryGridService.resetToStart.subscribe((msg) => {
      console.log('resetToStart triggered. setting date', this.queryGridService.getDate())
      this.setDate()
    })

    this.selectGridService.gridMetaChange.subscribe((gridMeta: GridMeta) => {
      this.setDate()
      this.dates = gridMeta.dates
      this.minDate = new Date(gridMeta.minDate)
      this.maxDate = new Date(gridMeta.maxDate)
      if (!this.dates.includes(this.date.format())) {
        let newDate = this.dates[0]
        this.date = moment.utc(newDate)
      }
      this.queryGridService.sendDate(this.date, false)
    })
  }

  public increment(sign: number): void {
    const increment = sign * this.inc
    this.monthPicker? this.date.add(increment, 'M') : this.date.add(increment, 'd')
    this.dateForm = new FormControl(this.date)
    console.log(`date incremented to ${this.date.format('YYYY-MM-DD')}`)
    this.sendDate()
  }

  public setDate(): void {
    this.date = this.queryGridService.getDate()
    this.dateForm = new FormControl(this.date)
  }

  public sendDate(): void {
    const broadcastChange = true;
    this.queryGridService.sendDate(this.date, broadcastChange)
  }

  public displaydate_changed(date: moment.Moment): void {
    //triggered when user changes date manually
    this.dateForm.setValue(date)
    this.date = date
    this.sendDate()
  }

  public chosenYearHandler(year: number) {
    //triggered when user selects on menu
    const ctrlValue = this.dateForm.value;
    ctrlValue.year(year);
    this.dateForm.setValue(ctrlValue);
    this.date = ctrlValue
    this.sendDate()
  }

  public chosenMonthHandler(month: number) {
    //triggered when user selects month on menu
    const ctrlValue = this.dateForm.value;
    ctrlValue.month(month);
    this.dateForm.setValue(ctrlValue);
    this.datepicker.close();
    this.date = ctrlValue
    this.sendDate()
  }

  dateFilter = (date: moment.Moment): boolean => {
    // return date.month() % 2 == 1 //filter out odd months
    return true
  } 

}
