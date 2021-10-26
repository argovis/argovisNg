import { Component, Inject, OnInit } from '@angular/core';
import { DatabaseOverview } from '../../../models/db-overview'
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {MatBottomSheet, MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA} from '@angular/material/bottom-sheet';
import { environment } from '../../../../environments/environment';
import * as moment from 'moment';


@Component({
  selector: 'app-db-overview',
  templateUrl: './db-overview.component.html',
  styleUrls: ['./db-overview.component.css']
})
export class DbOverviewComponent implements OnInit {

  public dbOverview: DatabaseOverview;

  constructor(private http: HttpClient, private bottomSheet: MatBottomSheet) { }
  ngOnInit() { }

  public open_bottom_sheet(): void {
    this.get_database_info().subscribe((dbOverview: DatabaseOverview) => {
      this.dbOverview = dbOverview
      const lastDate = moment(this.dbOverview.lastAdded).format('LLLL')

      let bottomData = this.dbOverview
      bottomData.lastAdded = lastDate
      this.bottomSheet.open(BottomSheet, { data: bottomData })
      }, 
   error => {
     console.log('error occured when retrieving dbOverview')
     console.log(error)
   });
  }

  private get_database_info(): Observable<DatabaseOverview> {
    const url = environment.apiRoot + '/profiles/overview';
    return this.http.get<DatabaseOverview>(url, {'headers': environment.apiHeaders})
  }
}

@Component({
  selector: 'bottom-sheet',
  templateUrl: 'bottom-sheet.html',
})
export class BottomSheet {
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: any, private bottomSheetRef: MatBottomSheetRef<BottomSheet>) {}
}