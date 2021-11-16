import { Component, OnInit, ViewChild } from '@angular/core'
import { ProfileMeta } from '../profiles'
import { GetProfilesService } from '../get-profiles.service'
import { QueryProfviewService } from '../query-profview.service'
import { MatPaginator } from '@angular/material/paginator'
import { MatTableDataSource } from '@angular/material/table'
import { MatSort } from '@angular/material/sort'
import { DataexchangeService } from "../dataexchange.service"

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator
  @ViewChild(MatSort, {static: false}) sort: MatSort

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

      // plot the first thing in the list by default, register everything else in checkstate
      profileMeta.map(x => this.checkstate[x['_id']] = false, this)
      profileMeta.map( (x,i) => {
        let plots = this.queryProfviewService.state.profiles ? this.queryProfviewService.state.profiles.split(',') : []
        if(plots.includes(x['_id']) || (plots.length==0 && i==0)){
          this.programmatic_plot(x['_id'], true)
        }
      }, this)
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
    this.checkstate[values.currentTarget.id] = values.currentTarget.checked
    this.exchange.sendData({id: values.currentTarget.id, checked: values.currentTarget.checked});

    // manage toggleAll switch
    let all = <HTMLInputElement>document.getElementById("toggleAll")
    if(Object.keys(this.checkstate).map(k => this.checkstate[k]).every(x=>x)) {
      all.checked = true
    }
    else all.checked = false    
  }

  programmatic_plot(id, desiredstate) {
    // id == profile ID, desired state == true for on, false for off
    
    // toggle profile
    this.toggleProfile({currentTarget: {id: id, checked: desiredstate}})
  }


  toggleAll(): void {
    let allon = Object.keys(this.checkstate).map(k => this.checkstate[k]).every(x=>x)
    if(allon){
      // turn all off
      Object.keys(this.checkstate).map(k => this.programmatic_plot(k, false), this)
    } else {
      // turn all on if not on already
      Object.keys(this.checkstate).map(k => {if(!this.checkstate[k]) this.programmatic_plot(k, true)}, this)
    }
  }
}