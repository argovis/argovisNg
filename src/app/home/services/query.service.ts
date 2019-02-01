import { Injectable, EventEmitter, Output } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router'
import { DateRange } from '../../../typeings/daterange';
import * as moment from 'moment';

@Injectable()
export class QueryService {

  @Output() change: EventEmitter<string> = new EventEmitter
  @Output() urlBuild: EventEmitter<string> = new EventEmitter
  @Output() triggerPlatformDisplay: EventEmitter<string> = new EventEmitter
  @Output() clearLayers: EventEmitter<string> = new EventEmitter
  @Output() resetToStart: EventEmitter<string> = new EventEmitter
  @Output() displayPlatform: EventEmitter<string> = new EventEmitter

  private presRange = [0, 2000];
  private selectionDateRange = {start: moment().subtract(14, 'days').format('YYYY-MM-DD'), end: moment().format('YYYY-MM-DD') };
  private displayDate: string;
  private latLngShapes: GeoJSON.FeatureCollection | any;
  private includeRealtime = true;
  private onlyBGC = false;
  private onlyDeep = false;
  private threeDayToggle = true;
  private proj: string;


  constructor(private route: ActivatedRoute, private location: Location) { }


  public setURL(): void {

  }

  public getURL() {
    console.log(location.pathname)
    console.log(location.href)
    return location
  }

  public triggerPlatformShow(platform: string): void {
    this.triggerPlatformDisplay.emit(platform)
  }

  public triggerClearLayers(): void {
    this.clearLayers.emit()
  }

  public triggerResetToStart(): void {
    this.resetToStart.emit()
  }

  public triggerShowPlatform(platform: string): void {
    this.displayPlatform.emit(platform);
  }

  public sendShapeMessage(data: GeoJSON.FeatureCollection | any, broadcastChange=true): void { //really a GeoJSON.Feature[] object, but for testing purposes, need to make it an any
    const msg = 'shape';
    this.latLngShapes = data.features;
    if (broadcastChange){ this.change.emit(msg) }
  }

  public sendProj(proj: string): void {
    const msg = 'proj changed';
    this.proj = proj;
    this.setURL();
    //todo: go to new page with url state and projection
  }

  public setProj(proj: string): void {
    this.proj = proj
  }

  public getProj(): string {
    return this.proj;
  }

  public getShapes(): any {
    return this.latLngShapes;
  }

  public clearShapes(): void {
    this.latLngShapes = null;
  }

  public sendPresMessage(presRange: number[], broadcastChange=true): void {
    const msg = 'presRange';
    this.presRange = presRange;
    if (broadcastChange){ this.change.emit(msg) }
  }

  public getPresRange(): Number[] {
    return this.presRange;
  }

  public sendSelectedDateMessage(selectionDateRange: DateRange, broadcastChange=true): void {
    const msg = 'selection date';
    this.selectionDateRange = selectionDateRange;
    if (broadcastChange){ this.change.emit(msg) }
  }

  public getSelectionDates(): any {
    return this.selectionDateRange;
  }

  public sendDisplayDateMessage(displayDate: string, broadcastChange=true): void {
    const msg = 'display date';
    this.displayDate = displayDate;
    if (broadcastChange){ this.change.emit(msg) }
  }

  public getDisplayDate(): any{
    return this.displayDate;
  }

  public sendToggleMsg(toggleChecked: Boolean, broadcastChange=true): void {
    const msg = 'realtime'
    this.includeRealtime = toggleChecked.valueOf()
    if (broadcastChange){ this.change.emit(msg) }
  }

  public getRealtimeToggle(): boolean {
    return this.includeRealtime;
  }

  public sendThreeDayMsg(toggleChecked: Boolean, broadcastChange=true): void {
    const msg = '3 day toggle'
    this.threeDayToggle = toggleChecked.valueOf()
    if (broadcastChange){ this.change.emit(msg) }
  }

  public getThreeDayToggle(): boolean {
    return this.threeDayToggle;
  }


  sendBGCToggleMsg(toggleChecked: Boolean, broadcastChange=true): void {
    const msg = 'bgc only'
    this.onlyBGC = toggleChecked.valueOf()
    if (broadcastChange){ this.change.emit(msg) }
  }

  public getBGCToggle(): boolean {
    return this.onlyBGC
  }

  sendDeepToggleMsg(toggleChecked: Boolean, broadcastChange=true): void {
    const msg = 'deep only'
    this.onlyDeep = toggleChecked.valueOf()
    if (broadcastChange){ this.change.emit(msg) }
  }

  public getDeepToggle(): boolean {
    return this.onlyDeep
  }

  public setMapState(this, key: string, value: string): void {
    const notifyChange = false
    switch(key) {
      case 'map': {
        this.setProj(value)
        break;
      }
      case 'includeRealtime': {
        const includeRealtime = JSON.parse(value)
        this.sendToggleMsg(includeRealtime, notifyChange)
        break;
      }
      case 'onlyBGC': {
        const onlyBGC = JSON.parse(value)
        this.sendBGCToggleMsg(onlyBGC, notifyChange)
        break;
      }
      case 'onlyDeep': {
        const onlyDeep = JSON.parse(value)
        this.sendDeepToggleMsg(onlyDeep, notifyChange)
        break;
      }
      case 'threeDayToggle': {
        const threeDayToggle = JSON.parse(value)
        this.sendThreeDayMsg(threeDayToggle, notifyChange)
        break;
      }
      case 'displayDate': {
        const displayDate = value
        this.sendDisplayDateMessage(displayDate, notifyChange)
        break;
      }
      case 'shape': {
        const shape = {features: JSON.parse(value)} //todo: format into feature collection
        this.sendShapeMessage(shape, notifyChange)
        break;
      }
      case 'startDate': {
        const stateDateRange = {start: value, end: this.selectionDateRange.end}
        this.sendSelectedDateMessage(stateDateRange, notifyChange)
        break;
      }
      case 'endDate': {
        const stateDateRange = {start: this.selectionDateRange.start, end: value}
        this.sendSelectedDateMessage(stateDateRange, notifyChange)
        break;
      }
      case 'presRange': {
        const presRange = JSON.parse(value)
        this.sendPresMessage(presRange, notifyChange)
        break;
      }
      default: {
        console.log('key not found. not doing anything')
        break;
    }
  }
}

}
