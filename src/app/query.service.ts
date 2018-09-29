import { Injectable, EventEmitter, Output } from '@angular/core';
import { GeoJsonObject } from 'geojson';
import { DateRange } from '../typeings/daterange';

@Injectable()
export class QueryService {

  @Output() change: EventEmitter<string> = new EventEmitter
  @Output() triggerPlatformDisplay: EventEmitter<string> = new EventEmitter
  @Output() clearLayers: EventEmitter<string> = new EventEmitter
  @Output() resetToStart: EventEmitter<string> = new EventEmitter
  @Output() displayPlatform: EventEmitter<string> = new EventEmitter

  private presRange: Number[];
  private dateRange: any;
  private latLngShapes: any;
  private includeRealtime: Boolean;


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

  public sendShapeMessage(data: GeoJSON.FeatureCollection | any): void { //really a GeoJSON.Feature[] object, but for testing purposes, need to make it an any
    const msg = 'shape';
    this.latLngShapes = data.features;
    this.change.emit(msg);
  }

  public getShapes(): any {
    return this.latLngShapes;
  }

  public sendPresMessage(presRange: Number[]): void {
    const msg = 'presRange';
    this.presRange = presRange;
    this.change.emit(msg);
  }

  public getPresRange(): Number[] {
    return this.presRange;
  }

  public sendDateMessage(dateRange: DateRange): void {
    const msg = 'date';
    this.dateRange = dateRange;
    this.change.emit(msg);
  }

  public getDates(): any {
    return this.dateRange;
  }

  public sendToggleMsg(toggleChecked: Boolean): void {
    const msg = 'realtime'
    this.includeRealtime = toggleChecked
    this.change.emit(msg)
  }

  public getToggle(): Boolean {
    return this.includeRealtime;
  }

  constructor() { }

}
