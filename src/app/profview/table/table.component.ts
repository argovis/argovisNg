import { Component, OnInit, ViewChild, ViewChildren, QueryList, AfterViewInit } from '@angular/core'
import { ProfileMeta } from '../profiles'
import { GetProfilesService } from '../get-profiles.service'
import { QueryProfviewService } from '../query-profview.service'
import { MatPaginator } from '@angular/material/paginator'
import { MatTableDataSource } from '@angular/material/table'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatSort } from '@angular/material/sort'
import { DataexchangeService } from "../dataexchange.service"

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator
  @ViewChild(MatSort, {static: false}) sort: MatSort
  @ViewChildren ("profilechecks") tablecheck: QueryList<MatCheckboxModule>;

  constructor(private getProfileService: GetProfilesService, 
              private queryProfviewService: QueryProfviewService,
              public exchange: DataexchangeService ) { }
  public metaColumns: string[] = ['cycle_number', '_id', 'dac', 'date',
                                   'lat_str', 'lon_str',
                                    'DATA_MODE', 'display']
  public dataSource: any
  public platform_number: string
  public statParamKey: string
  public checkstate: any

  ngAfterViewInit(): void {
    // this.tablecheck.changes.subscribe(c => { 
    //   console.log(c.first)
    //   c.first.toggle()
    // });
  }


  ngOnInit(): void {

    this.queryProfviewService.set_params_from_url('setting url from table component')
    this.queryProfviewService.set_url() // sets default parameters

    this.platform_number = this.queryProfviewService.platform_number
    this.statParamKey = this.queryProfviewService.statParamKey

    this.checkstate = {}
    
    this.getProfileService.getPlaformProfileMetaData(this.platform_number).subscribe( (profileMeta: ProfileMeta[]) => {
      profileMeta = this.queryProfviewService.applyFormatting(profileMeta, this.statParamKey)
      this.queryProfviewService.sendProfileMeta(profileMeta)
      const statParams = this.queryProfviewService.makeUniqueStationParameters(profileMeta, this.statParamKey)
      this.dataSource = new MatTableDataSource()
      this.dataSource.data = profileMeta
      this.dataSource.paginator = this.paginator
      this.dataSource.sort = this.sort

      // plot the first thing in the list by default
      profileMeta.map( (x,i) => {
        this.checkstate[x['_id']] = i==0}
      , this)
    },  
    error => {  
      console.log('There was an error while retrieving profiles metadata.',  error);  
    })
  }

  public apply_filter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  toggleProfile(values: any): void {
    this.checkstate[values.source.name] = values.checked
    this.exchange.sendData({id: values.source.name, checked: values.checked});
    console.log(this.checkstate)
  }

}
