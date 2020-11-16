import { Injectable, Output, EventEmitter, Injector } from '@angular/core'
import { QueryService } from './../home/services/query.service'
import * as moment from 'moment'
import { DateRange } from './../../typeings/daterange'
import { MapState } from './../../typeings/mapState'
import { TcTrack } from '../models/tc-shape'
@Injectable({
  providedIn: 'root'
})
export class TcQueryService extends QueryService {

  @Output() tcEvent: EventEmitter<string> = new EventEmitter


  private tcStartDate = moment(new Date( 2018, 7, 15, 0, 0, 0, 0))
  private tcEndDate = moment(new Date( 2018, 7, 17, 0, 0, 0, 0))
  private tcTracks: number[][][]
  private profHourRange = [-18, 18] as [number, number]
  private displayGlobally = true
  public selectionDateRange = this.convert_hour_range_to_date_range(this.tcStartDate, this.tcEndDate, this.profHourRange, 'inital set date range')

  constructor( public injector: Injector ) { super(injector) }

  public reset_params(): void{
    console.log('tc reset params pressed')
    const broadcastChange = false
    this.sendDeepToggleMsg(false, broadcastChange)
    this.sendBGCToggleMsg(false, broadcastChange)
    this.sendRealtimeMsg(true, broadcastChange)
    const tcStartDate = moment(new Date( 2018, 7, 15, 0, 0, 0, 0))
    const tcEndDate = moment(new Date( 2018, 7, 17, 0, 0, 0, 0))
    const profHourRange = [-18, 18] as [number, number]
    this.send_display_globally(true, broadcastChange)
    const selectionDateRange = this.convert_hour_range_to_date_range(tcStartDate, tcEndDate, profHourRange)
    this.send_selected_date(selectionDateRange, broadcastChange)
    this.send_tc_start_date(tcStartDate, broadcastChange)
    this.send_tc_end_date(tcEndDate, broadcastChange)
    // this.send_prof_date_range(profHourRange)
  }

  public convert_hour_range_to_date_range(startDate: moment.Moment, endDate: moment.Moment, hourRange: [number, number], msg=''): DateRange {
    const dateRange: DateRange = {
      startDate: startDate.clone().add(hourRange[0], 'hours').format('YYYY-MM-DDTHH:mm:ss').replace(':', '%3A'),
      endDate: endDate.clone().add(hourRange[1], 'hours').format('YYYY-MM-DDTHH:mm:ss').replace(':', '%3A'),
      label: 'msg'
    };
    return dateRange
  }

  public trigger_reset_to_start(): void {
    this.reset_params()
    this.resetToStart.emit()
    this.set_url()
  }

  public set_selection_date_range(): void {
    const broadcastChange = false
    const startDate = this.format_date(this.tcStartDate.clone().add(this.profHourRange[0], 'h')) //make sure to clone and format date correctly
    const endDate = this.format_date(this.tcEndDate.clone().add(this.profHourRange[1], 'h'))
    const dateRange: DateRange = {startDate: startDate, endDate: endDate, label: ''}
    this.send_selected_date(dateRange, broadcastChange)
  }

  public round_shapes(shapes: number[][][]): number[][][] {
    shapes.forEach(shape => {
      shape.forEach( point => {
        point[0] = Math.round((point[0] + Number.EPSILON) * 100) / 100
        point[1] = Math.round((point[1] + Number.EPSILON) * 100) / 100
      })
    })
    return shapes
  }


  public set_url(): void {
    console.log('setting tc url')
    const profDateRangeString = JSON.stringify(this.profHourRange)
    const tcStartDateString = this.tcStartDate.format('YYYY-MM-DDTHH:mm:ss')
    const tcEndDateString = this.tcEndDate.format('YYYY-MM-DDTHH:mm:ss')
    let shapesString = null
     const shapes = this.get_shapes()
     if (shapes) {
       shapesString = JSON.stringify(shapes)
    }
    const queryParams = {
                         'includeRealtime': this.get_realtime_toggle(),
                         'onlyBGC': this.get_bgc_toggle(),
                         'onlyDeep': this.get_deep_toggle(),
                         'profHourRange': profDateRangeString,
                         'tcStartDate': tcStartDateString,
                         'tcEndDate': tcEndDateString,
                         'selectionStartDate': this.get_selection_dates().startDate,
                         'selectionEndDate': this.get_selection_dates().endDate,
                         'displayGlobally': this.get_display_globally(),
                         'shapes': shapesString
                        }
    this.router.navigate(
      [], 
      {
        relativeTo: this.route,
        queryParams: queryParams,
      });
  }

  public get_display_globally(): boolean {
    return this.displayGlobally
  }

  public send_display_globally(displayGlobally: boolean, broadcastChange=true): void {
    this.displayGlobally = displayGlobally
    if (broadcastChange) { this.change.emit('displayGlobally changed')}
  }


  public send_prof_date_range(sliderRange: [number, number], broadcastChange=true, msg=''): void {
    this.profHourRange = sliderRange
    this.selectionDateRange = this.convert_hour_range_to_date_range(this.tcStartDate, this.tcEndDate, sliderRange, msg)
    if (broadcastChange) { this.change.emit('prof date range changed')}
  }

  public get_tc_date_range(): [moment.Moment, moment.Moment] {
    return [this.tcStartDate, this.tcEndDate]
  }

  public get_prof_date_range(): DateRange {
    const tcDateRange = this.get_tc_date_range();
    const hourRange = this.get_prof_hour_range() as [number, number]
    const dates = this.convert_hour_range_to_date_range(tcDateRange[0], tcDateRange[1], hourRange, 'shape from buffer')
    return dates
  }

  public send_tc_start_date(date: moment.Moment, broadcastChange=true): void {
    this.tcStartDate = date
    if (broadcastChange) { this.change.emit('tcStartDate changed')}
  }

  public send_tc_end_date(date: moment.Moment, broadcastChange=true): void {
    this.tcEndDate = date
    if (broadcastChange) { this.change.emit('tcEndDate changed')}
  }

  public set_prof_hour_range(sliderRange: [number, number], broadcastChange=true): void {
    this.profHourRange = [...sliderRange] as [number, number]
    if (broadcastChange) { this.change.emit('slider range changed')}
  }

  public get_prof_hour_range(): [number, number] | number[] {
    return [...this.profHourRange]
  }

  public format_date(date: moment.Moment): string {
    return date.format("YYYY-MM-DDTHH:mm:ss") + 'Z'
  }

  public get_tc_date_as_date_range(): DateRange {
    const startDate = this.format_date(this.tcStartDate.clone())
    const endDate = this.format_date(this.tcEndDate.clone())
    const dateRange: DateRange = {startDate: startDate, endDate: endDate, label: ''}
    return dateRange
  }
 
  public send_tc_tracks(data: number[][][], broadcastChange=true): void {
    this.tcTracks = data
    if (broadcastChange) { this.change.emit('tc track change')}
  }

  public get_tc_tracks(): number[][][] {
    return this.tcTracks
  }

  public set_params_from_url(msg='got state from map component'): void {
    // let mapState: MapState
    this.route.queryParams.subscribe(params => {
      let mapState = params
      Object.keys(mapState).forEach(key => {
        this.tc_set_map_state(key, mapState[key])
      });
      this.urlBuild.emit(msg)
    });
  }
 

  public tc_set_map_state(key: string, value: string): void {
    const notifyChange = false
    switch(key) {
      case 'includeRealtime': {
        const includeRealtime = JSON.parse(value)
        this.sendRealtimeMsg(includeRealtime, notifyChange)
        break
      }
      case 'onlyBGC': {
        const onlyBGC = JSON.parse(value)
        this.sendBGCToggleMsg(onlyBGC, notifyChange)
        break
      }
      case 'onlyDeep': {
        const onlyDeep = JSON.parse(value)
        this.sendDeepToggleMsg(onlyDeep, notifyChange)
        break;
      }
      case 'displayGlobally': {
        const displayGlobally = JSON.parse(value)
        this.send_display_globally(displayGlobally, notifyChange)
        break;

      }
      case 'profHourRange': {
        const tcHourRange = JSON.parse(value)
        this.send_prof_date_range(tcHourRange, notifyChange)
        break
      }
      case 'tcStartDate': {
        const tcDate = moment(value)
        this.send_tc_start_date(tcDate, notifyChange)
        break
      }
      case 'tcEndDate': {
        const tcDate = moment(value)
        this.send_tc_end_date(tcDate, notifyChange)
        break
      }
      case 'selectionStartDate': {
        const stateDateRange = {startDate: value, endDate: this.selectionDateRange.endDate}
        this.send_selected_date(stateDateRange, notifyChange)
        break
      }
      case 'selectionEndDate': {
        const stateDateRange = {startDate: this.selectionDateRange.startDate, endDate: value}
        this.send_selected_date(stateDateRange, notifyChange)
        break
      }
      case 'shapes': {
        const arrays = JSON.parse(value)
        const toggleThreeDayOff = false
        this.send_shape(arrays, notifyChange, toggleThreeDayOff)
        break
      }
      default: {
        console.log('key not found. not doing anything: ', key)
        break;
    }
  }
}
}
