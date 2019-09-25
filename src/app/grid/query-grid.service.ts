import { Injectable, EventEmitter, Output } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'
import { MapState } from './../../typeings/mapState';
import { GridGroup, ProducerGroup, ParamGroup } from './../../typeings/grids';

import * as _moment from 'moment';
import {Moment} from 'moment';
import { FeatureCollection, Feature, Polygon } from 'geojson';
const moment = _moment;

@Injectable()
export class QueryGridService {

  @Output() change: EventEmitter<string> = new EventEmitter
  @Output() resetToStart: EventEmitter<string> = new EventEmitter
  @Output() clearLayers: EventEmitter<string> = new EventEmitter
  @Output() urlBuild: EventEmitter<string> = new EventEmitter

  private presLevel = 10;
  private monthYear = moment('01-2007', 'MM-YYYY');
  private mapState: MapState;
  private grid = 'kuusela';
  private compareGrid: string;
  private latLngShapes: FeatureCollection<Polygon>;
  private compare = false;
  private globalGrid = false;

  private ksGrids: GridGroup[] = [
    {value: 'ksSpaceTempNoTrend' , viewValue: 'Space No Trend Anomaly'  },
    {value: 'ksSpaceTempTrend' , viewValue: 'Space Trend Anomaly'  },
    {value: 'ksSpaceTempTrend2' , viewValue: 'Space Trend2 Anomaly'  },
  ];
  private rgGrids: GridGroup[] = [
    {value: 'rgTempAnom', viewValue: 'Anomaly'}
  ]
  private ksGroup: ProducerGroup = {producer: 'Kuusela-Stein', grids: this.ksGrids}

  private rgGroup: ProducerGroup = {producer: 'Rommich-Gilson', grids: this.rgGrids}

  private tempGroup: ParamGroup = {param:'Temperature', producers: [this.rgGroup, this.ksGroup]}

  public allParams = [this.tempGroup]

  constructor(private route: ActivatedRoute,
    private location: Location,
    private router: Router) { this.router.urlUpdateStrategy = 'eager' }

  public formatMonthYear(monthYear: Moment): string {
    const monthYearString = monthYear.format('MM-YYYY')
    return(monthYearString)
  }

  public resetParams(): void{
    const broadcastChange = false
    const monthYear = moment('01-2007', 'MM-YYYY')
    this.sendMonthYearMessage(monthYear, broadcastChange)
    const presLevel = 10;
    this.sendPresMessage(presLevel, broadcastChange)
    this.clearShapes()
    this.setURL()
    this.resetToStart.emit('reset params pushed')
  }

  public sendPresMessage(presLevel: number, broadcastChange=true): void {
    const msg = 'pres level change';
    this.presLevel = presLevel;
    if (broadcastChange){ this.change.emit(msg) }
  }

  public getPresLevel(): number {
    return this.presLevel;
  }

  public sendMonthYearMessage(monthYear: Moment, broadcastChange=true): void {
    const msg = 'month year change';
    this.monthYear = monthYear;
    if (broadcastChange){ this.change.emit(msg) }
  }

  public getMonthYear(): Moment {
    return this.monthYear;
  }

  public sendShapeMessage(features: FeatureCollection<Polygon>, broadcastChange=true): void {
    let msg = 'shape change';
    this.latLngShapes = features;
    if (broadcastChange){ this.change.emit(msg) }
  }

  public getShapes(): FeatureCollection<Polygon> {
    return this.latLngShapes;
  }

  public sendGridMessage(grid: string, broadcastChange=true): void {
    let msg = 'grid change';
    this.grid = grid;
    if (broadcastChange) { this.change.emit(msg) }
  }

  public getGrid(): string {
    return this.grid
  }

  public sendCompareGridMessage(grid: string, broadcastChange=true): void {
    let msg = 'compare grid change';
    this.compareGrid = grid;
    if (broadcastChange) { this.change.emit(msg) }
  }

  public getCompareGrid(): string {
    return this.compareGrid
  }

  public clearShapes(): void {
    this.latLngShapes = null
  }

  public getGlobalGrid(): boolean {
    return this.globalGrid
  }

  public sendGlobalGrid(globalGrid: boolean, broadcastChange=true): void {
    const msg = 'global grid toggle'
    this.globalGrid = globalGrid
    if (broadcastChange) { this.change.emit(msg)}
  }

  public sendCompare(compareToggle: boolean, broadcastChange=true): void {
    const msg = 'compare grid toggled'
    this.compare = compareToggle
    if (broadcastChange) { this.change.emit(msg)}
  }

  public getCompare(): boolean {
    return this.compare
  }

  public getShapeArray(fc: FeatureCollection<Polygon>): number[][][] {
    let shapeArray = []
    console.log(fc)
    fc.features.forEach( (feature) => {
      console.log('feature', feature)
      let latLngArray = []
      const coordinates = feature.geometry.coordinates[0]
      coordinates.forEach( (coord) => {
        const latLng = [coord[1], coord[0]]
        latLngArray.push(latLng)
      })
      shapeArray.push(latLngArray)
    })
    return shapeArray
  }

  public triggerResetToStart(): void {
    this.resetParams()
    this.resetToStart.emit()
    this.setURL()
  }

  public triggerClearLayers(): void {
    this.clearLayers.emit()
  }

  public setURL(): void {

    const presLevelString = JSON.stringify(this.presLevel)
    let shapesString = null
    let bboxes: number[][]
    if (this.latLngShapes) {
      bboxes = this.getBBoxes(this.latLngShapes)
      shapesString = JSON.stringify(bboxes)
    }
    const globalGrid = JSON.stringify(this.getGlobalGrid())
    const monthYearString = this.formatMonthYear(this.monthYear)
    let queryParams = {
                         'presLevel': presLevelString, 
                         'monthYear': monthYearString,
                         'shapes': shapesString,
                         'grid': this.grid,
                         'displayGlobalGrid': globalGrid
                        }
    if (this.compare) {
      queryParams['compareGrid'] = this.compareGrid
    }
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: queryParams,
      });
  }

  public getBBoxes(fc: FeatureCollection<Polygon>): number[][] {
    let bboxes = []
    const features = fc.features
    for (let idx in features) {
      const feature = features[idx];
      var geom: any
      geom = feature.geometry
      const coords = geom.coordinates.reduce(function(dump,part) {
        return dump.concat(part);
      }, [])
      let bbox = [ Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY,];

      bbox = coords.reduce(function(prev,coord) {
        return [
          Math.min(coord[0], prev[0]),
          Math.min(coord[1], prev[1]),
          Math.max(coord[0], prev[2]),
          Math.max(coord[1], prev[3])
        ];
      }, bbox);
      bboxes = bboxes.concat([bbox])
    }
    return bboxes
  }

  //todo: cast as Feature and FeatureCollection types
  private convertShapeToFeatureCollection(shapes: number[][]): FeatureCollection<Polygon> {

    let fc: FeatureCollection<Polygon> = { type: 'FeatureCollection',
    features: [] 
    };

    shapes.forEach( (shape) => {
      let feature: Feature<any> = { type: 'Feature', geometry: {}, properties: {}}
      let geom: Polygon = { type: 'Polygon', coordinates: [] }
      const ll = [shape[0], shape[1]]
      const ur = [shape[2], shape[3]]
      const ul = [ll[0], ur[1]]
      const lr = [ur[0], ll[1]]
      const coordinates = [ll, ul, ur, lr, ll]
      geom.coordinates = [coordinates]
      feature.geometry = geom
      fc.features.push(feature)
    })

    return(fc)
  }

  public setParamsFromURL(): void {
    this.route.queryParams.subscribe(params => {
      this.mapState = params
      Object.keys(this.mapState).forEach((key) => {
        this.setMapState(key, this.mapState[key])
      });
      this.urlBuild.emit('got state from map component')
    });
  }

  public setMapState(this, key: string, value: string): void {
    const notifyChange = false
    switch(key) {
      case 'monthYear': {
        const monthYear = moment(value, 'MM-YYYY')
        this.sendMonthYearMessage(monthYear, notifyChange)
        break;
      }
      case 'grid': {
        const grid = value
        this.sendGridMessage(grid, notifyChange)
        break;
      }
      case 'compareGrid': {
        const grid = value
        this.compare = true
        this.sendCompareGridMessage(grid, notifyChange)
        break;
      }
      case 'shapes': {
        const arrays = JSON.parse(value)
        const fc = this.convertShapeToFeatureCollection(arrays)
        console.log('shapes set from url: ', fc)
        this.sendShapeMessage(fc, notifyChange)
        break;
      }
      case 'displayGlobalGrid': {
        const globalGrid = JSON.parse(value)
        this.sendGlobalGrid(globalGrid, notifyChange)
        break;
      }
      case 'presLevel': {
        const presLevel = JSON.parse(value)
        this.sendPresMessage(presLevel, notifyChange)
        break;
      }
      default: {
        console.log('key not found. not doing anything')
        break;
    }
  }
}

}
