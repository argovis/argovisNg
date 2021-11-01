import { Injectable, EventEmitter, Output } from '@angular/core';
import { GridGroup, ProducerGroup, MeasGroup, GridParamGroup, EarthProperty, ModelParam, GridMeta } from './../../typeings/grids'
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import * as moment from 'moment'
@Injectable({
  providedIn: 'root'
})
export class SelectGridService {

  constructor(private http: HttpClient) { }
  @Output() gridMetaChange: EventEmitter<GridMeta> = new EventEmitter

  private readonly nonUniformGrids = ['sose_si_area_1_day', 'sose_si_area_1_day_sparse', 'sose_si_area_3_day', 'sose_si_area_monthly']

  private readonly ksGrids: GridGroup[] = [
    // {grid: 'ksSpaceTempNoTrend', param: 'tempAnomaly', viewValue: 'Space No Trend Anomaly'  },
    // {grid: 'ksSpaceTempTrend' , param: 'tempAnomaly', viewValue: 'Space Trend Anomaly'  },
    // {grid: 'ksSpaceTempTrend2', param: 'tempAnomaly', viewValue: 'Space Trend2 Anomaly'  },
    // {grid: 'ksSpaceTimeTempNoTrend', param: 'tempAnomaly',viewValue: 'Space Time No Trend Anomaly'  },
    // {grid: 'ksSpaceTimeTempTrend', param: 'tempAnomaly', viewValue: 'Space Time Trend Anomaly'  },
    // {grid: 'ksSpaceTimeTempTrend2', param: 'tempAnomaly', viewValue: 'Space Time Trend2 Anomaly'  },
    // {grid: 'ksTempTrend', param: 'tempMean',viewValue: 'Trend Mean Field'  },
    // {grid: 'ksTempNoTrend', param: 'tempMean',viewValue: 'No Trend Mean Field'  },
    // {grid: 'ksTempTrend2', param: 'tempMean',viewValue: 'Trend 2 Mean Field'  },
    {grid: 'ksSpaceTempNoTrendTotal', param: 'tempTotal', viewValue: 'Space No Trend Total'  },
    {grid: 'ksSpaceTempTrendTotal', param: 'tempTotal', viewValue: 'Space Trend Total'  },
    {grid: 'ksSpaceTempTrend2Total', param: 'tempTotal', viewValue: 'Space Trend2 Total'  },
    {grid: 'ksSpaceTimeTempTrendTotal', param: 'tempTotal', viewValue: 'Space Time Trend Total'  },
    {grid: 'ksSpaceTimeTempTrend2Total', param: 'tempTotal', viewValue: 'Space Time Trend2 Total'  },
  ]

  private readonly rgGrids: GridGroup[] = [
    {grid: 'rgTempAnom', param: 'tempAnomaly', viewValue: 'RG Anomaly'},
    {grid: 'rgTempTotal', param: 'tempTotal', viewValue: 'RG Total'},
    {grid: 'rgPsalAnom', param: 'psalAnomaly', viewValue: 'RG Anomaly'},
    {grid: 'rgPsalTotal', param: 'psalTotal', viewValue: 'RG Total'}
  ]

  private readonly soseGrids: GridGroup[] = [
    {grid: 'sose_si_area_1_day_sparse', param: 'SIarea', viewValue: '1 day sea ice area fractional coverage (sparse)'},
    // {grid: 'sose_si_area_1_day', param: 'SIarea', viewValue: '1 day sea ice area fractional coverage'},
    // {grid: 'sose_si_area_3_day', param: 'SIarea', viewValue: '3 day sea ice area fractional coverage'},
    // {grid: 'sose_si_area_monthly', param: 'SIarea', viewValue: 'Monthly Sea ice area fractional coverage'},
  ]

  // private readonly allAvailableGrids = this.rgGrids.concat(this.ksGrids)
  private readonly allAvailableGrids = this.rgGrids.concat(...this.soseGrids) //only allow rg grids for now

  private readonly ksGridGroup: ProducerGroup = {producer: 'Kuusela-Stein', grids: this.ksGrids}
  private readonly rgGridGroup: ProducerGroup = {producer: 'Rommich-Gilson', grids: this.rgGrids}
  private readonly tempGridGroup: MeasGroup = {meas:'Temperature', producers: [this.rgGridGroup, this.ksGridGroup]}
  public readonly allGrids = [this.tempGridGroup]
  private readonly spaceTimeParams: ModelParam[]  = [ {modelParamName: 'nResGrid', viewValue: 'N Profiles'},
                                                      {modelParamName: 'nll', viewValue: 'Neg log liklihood'},
                                                      {modelParamName: 'thetaLatOpt', viewValue: 'Lat weight'},
                                                      {modelParamName: 'thetaLongOpt', viewValue: 'Lon weight'},
                                                      {modelParamName: 'thetasOpt', viewValue: 'spread weight'},
                                                      {modelParamName: 'thetatOpt', viewValue: 'time weight'},
                                                    ]
  private readonly spaceParams: ModelParam[]  = [{modelParamName: 'nResGrid', viewValue: 'N Profiles'},
                                                {modelParamName: 'nll', viewValue: 'Neg log liklihood'},
                                                {modelParamName: 'sigmaOpt', viewValue: 'spread weight'},
                                                {modelParamName: 'theta1Opt', viewValue: 'first weight'},
                                                {modelParamName: 'theta2Opt', viewValue: 'second weight'},
                                                  ]
  public readonly ksParams: GridParamGroup[] = [
    {grid: 'ksSpaceTempNoTrend', param: 'param', viewValue: 'Space No Trend Anomaly', params: this.spaceParams  },
    {grid: 'ksSpaceTempTrend', param: 'param', viewValue: 'Space Trend Anomaly', params: this.spaceParams   },
    {grid: 'ksSpaceTempTrend2', param: 'param',viewValue: 'Space Trend2 Anomaly', params: this.spaceParams   },
    {grid: 'ksSpaceTimeTempNoTrend', param: 'param',viewValue: 'Space Time No Trend Anomaly', params: this.spaceTimeParams   },
    {grid: 'ksSpaceTimeTempTrend', param: 'param',viewValue: 'Space Time Trend Anomaly', params: this.spaceTimeParams   },
    {grid: 'ksSpaceTimeTempTrend2', param: 'param',viewValue: 'Space Time Trend2 Anomaly', params: this.spaceTimeParams   },
  ]
  private readonly ksParamGroup: ProducerGroup = {producer: 'Kuusela-Stein', grids: this.ksParams}
  private readonly tempParamGroup: MeasGroup = {meas: 'Temperature', producers: [this.ksParamGroup]}
  public readonly allGridParams: MeasGroup[] =  [this.tempParamGroup]
  public readonly properties = [
                            {param:'tempTotal', viewValue: 'Temperature total (mean+anomaly)', colorScale: 'thermal'},
                            {param:'tempAnomaly', viewValue: 'Temperature Anomaly', colorScale: 'balance'},
                            {param:'psalTotal', viewValue: 'Salinity total (mean+anomaly)', colorScale: 'haline'},
                            {param:'psalAnomaly', viewValue: 'Salinity Anomaly', colorScale: 'balance'},
                            {param:'SIarea', viewValue: 'Sea Ice Area Fractional Coverage', colorScale: 'ice'}
                            //{param:'mean', viewValue: 'Mean'}
                          ] as EarthProperty[]


  public isUniform(gridName: string): boolean { return !this.nonUniformGrids.includes(gridName) }

  public getAvailableGrids(param: string): GridGroup[] {
    //select grids that have the following params: 'anomaly', 'mean', 'total'
    let availableGrids = []
    for (let idx=0; idx < this.allAvailableGrids.length; idx++) {
      const grid = this.allAvailableGrids[idx]
      if (grid['param'] == param) {
        availableGrids.push(grid)
      }
    }
    return availableGrids
  }

  public checkIfGridAvailable(grid: string, param: string): boolean {
    let obj = this.allAvailableGrids.find(g => (g.grid === grid) && (g.param === param));
    let gridAvailable
    obj ? gridAvailable = true: gridAvailable = false
    console.log('grid: ', grid, 'param: ', param , 'obj: ', obj, 'gridAvailable: ', gridAvailable)
    return gridAvailable
  }

  public getGridMeta(gridName: string): Observable<GridMeta[]> {
    const url = environment.apiRoot +'/griddedProducts/gridMetadata?gridName=' + gridName
    return this.http.get<GridMeta[]>(url, {'headers': environment.apiHeaders})
  }

}
