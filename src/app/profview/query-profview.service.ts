import { Injectable, EventEmitter, Output } from '@angular/core';
import { GetProfilesService } from './get-profiles.service'
import { ProfileMeta, StationParameters } from './profiles'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable } from 'rxjs';
import * as moment from 'moment';
import { environment } from '../../environments/environment';

export interface ChartItems{
  x1: string,
  x2: string,
}
@Injectable({
  providedIn: 'root'
})
export class QueryProfviewService {

  @Output() changeStatParams: EventEmitter<string> = new EventEmitter
  @Output() urlParsed: EventEmitter<string> = new EventEmitter
  @Output() buildChart: EventEmitter<number> = new EventEmitter
  @Output() profileMetaChanged: EventEmitter<string> = new EventEmitter
  public platform_number: string = "5903260"
  public topChart: string = 'doxy'
  public bottomChart: string = 'temp'
  public leftChart: ChartItems = {x1: 'temp', x2: 'pres'}
  public middleChart: ChartItems = {x1: 'psal', x2: 'pres'}
  public rightChart: ChartItems = {x1: 'psal', x2: 'temp'}
  public bgcPlatform: boolean = true
  public statParamKey: string = 'bgcMeasKeys'
  public statParams: StationParameters[]
  public measKey: string = 'bgcMeas'
  public profileMeta:  ProfileMeta[]
  public selectedIndex: number = 0
  public state: any = {A: {}, B: {}}

  constructor(private route: ActivatedRoute,
              private getProfileService: GetProfilesService,
              private router: Router) { this.router.urlUpdateStrategy = 'eager' }

  // Virtual fields for table
  public make_profile_link (_id: string): string {
    return environment.dpRoot + '/catalog/profiles/' + _id + '/bgcPage';
  }

  public sendProfileMeta(profileMeta: ProfileMeta[]): void {
    this.profileMeta = profileMeta
    this.profileMetaChanged.emit('profileMeta set')
  }

  public make_core_data_mode(DATA_MODE: string, PARAMETER_DATA_MODE): string {
    let core_data_mode
    if (DATA_MODE) {
      core_data_mode = DATA_MODE
    }
    else if (PARAMETER_DATA_MODE.length > 0) {
      core_data_mode = PARAMETER_DATA_MODE[0]
    }
    else {
      core_data_mode = 'Unknown'
    }
    return core_data_mode
  }

  public value_of_chart_labels(id: string): ChartItems {
    let chartLabel: ChartItems
    switch(id) {
      case 'leftChart': {
        chartLabel = this.leftChart
        break
      }
      case 'middleChart': {
        chartLabel = this.middleChart
        break
      }
      case 'rightChart': {
        chartLabel = this.rightChart
        break
      }
      default: {
        chartLabel = {x1: 'temp', x2: 'pres'}
        break
      }
    }
    return(chartLabel)
  }

  public set_chart_labels(id: string, chartLabel: ChartItems): void {
    switch(id) {
      case'leftChart': {
        this.leftChart = chartLabel
        break
      }
      case 'middleChart': {
        this.middleChart = chartLabel
        break
      }
      case 'rightChart': {
        this.rightChart = chartLabel
        break
      }
      default: {
        console.log('set_chart_labels id not found: ', id)
        break
      }
    }
  }

  public applyFormatting( profileMeta: ProfileMeta[], statKey: string): ProfileMeta[] {
    profileMeta.forEach( (row: ProfileMeta) => {
      row['lat_str'] = this.make_str_lat(row['lat'])
      row['lon_str'] = this.make_str_lon(row['lon'])
      row['date'] = moment(row['date']).format("YYYY-M-D");
    })
    return profileMeta
  }

  public makeUniqueStationParameters( profiles: ProfileMeta[], statParamsKey: string): void {
    let statParamSet = new Set();
    let uStatParam = [] as string[]
    profiles.forEach(prof => {
      const station_parameters = prof[statParamsKey]
      if (station_parameters) { 
        station_parameters.forEach( param => {
          if(!statParamSet.has(param)) {
            statParamSet.add(param);
            uStatParam.push(param)
          }
        })
      }
    })
    let statParams = [
      {value: 'time', viewValue: 'time'},
      {value: 'latitude', viewValue: 'latitude'},
      {value: 'longitude', viewValue: 'longitude'},
      {value: 'profileID', viewValue: 'profileID'}
    ] as StationParameters[]
    uStatParam.forEach( (statParam: string) => {
        statParams.push({value: statParam, viewValue: statParam})
    })
    this.statParams = statParams
    this.changeStatParams.emit('station param change')
  }

  public make_jcommops_platform(platform_number: string): string {
    return 'http://www.jcommops.org/board/wa/Platform?ref=' + platform_number
  }

  public make_fleet_monitoring_platform(platform_number: string): string {
    return 'https://fleetmonitoring.euro-argo.eu/float/' + platform_number
  }

  public round_to_three(x) {
    return x.toFixed(3);
  }

  public make_str_lat (lat: number): string {
    let strLat: string
    if (lat > 0) {
      strLat = Math.abs(lat).toFixed(3).toString() + ' N';
    }
    else {
        strLat = Math.abs(lat).toFixed(3).toString() + ' S';
    }
    return strLat
  }

  public make_str_lon(lon: number): string {
    let strLon: string
    if (lon > 0) {
      strLon = Math.abs(lon).toFixed(3).toString() + ' E';
    }
    else {
        strLon = Math.abs(lon).toFixed(3).toString() + ' W';
    }
    return strLon
  }

  public make_date_formatted(date: Date): string {
    return moment.utc(date).format('YYYY-MM-DD');
  }

  public set_params_from_url(msg?: string): void{
    this.route.queryParams.subscribe(params => {
      Object.keys(params).forEach(key => {
        this.set_map_state(key, params[key])
      });
    });
    if (!msg) { msg = 'url parsed. safe to build chart and window'}
    this.urlParsed.emit(msg)
  }

  public set_url(): void {

    const queryParams = {
                         'platform_number': this.platform_number,
                         'profiles': this.state.profiles,
                         'xA': this.state.A['x'], 
                         'yA': this.state.A['y'], 
                         'zA': this.state.A['z'],
                         'cminA': this.state.A['cmin'],
                         'cmaxA': this.state.A['cmax'],
                         'currentColorA': this.state.A['currentColor'],
                         'xB': this.state.B['x'], 
                         'yB': this.state.B['y'], 
                         'zB': this.state.B['z'],
                         'cminB': this.state.B['cmin'],
                         'cmaxB': this.state.B['cmax'],
                         'currentColorB': this.state.B['currentColor']
                         
                        }
    this.router.navigate(
      [], 
      {
        relativeTo: this.route,
        queryParams: queryParams,
        //queryParamsHandling: "merge"
      });
  }


  public set_map_state(this, key: string, value: string): void {
    if(key == 'platform_number') this.platform_number = value
    else if (key == 'profiles') this.state.profiles = value
    else if(key.slice(-1) == 'A') this.state.A[key.slice(0,-1)] = value
    else if(key.slice(-1) == 'B') this.state.B[key.slice(0,-1)] = value
  }
}
