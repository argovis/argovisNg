import { Component, OnInit, Input } from '@angular/core';
import { BgcProfileData, CoreProfileData, StationParameters } from './../profiles'
import { GetProfilesService } from '../get-profiles.service'
import { ChartService } from '../chart.service'
import { QueryProfviewService, ChartItems } from '../query-profview.service';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit {
  constructor(private getProfileService: GetProfilesService,
              private chartService: ChartService,
              private queryProfviewService: QueryProfviewService) { }
  public graph: any
  public chartTitle: string
  public platform_number: string
  public measKey: string
  public profileData: BgcProfileData[] |  CoreProfileData[]
  public statParams: StationParameters[]
  public layout: {}
  public bgcPlatform: boolean
  public statParamKey: string
  public yAxisTitle: string
  public chartLabels: ChartItems
  @Input() id: string
  public revision: number = 0
  public readonly reduceMeas = 200

  ngOnInit(): void {
    this.queryProfviewService.urlParsed.subscribe( (msg: string) => {
      this.chartLabels = this.queryProfviewService.value_of_chart_labels(this.id) 
      this.statParamKey = this.queryProfviewService.statParamKey
      this.platform_number = this.queryProfviewService.platform_number
      this.measKey = this.queryProfviewService.measKey
      this.bgcPlatform = this.queryProfviewService.bgcPlatform

      const lineChartTabSelected = Boolean(this.queryProfviewService.selectedIndex)
      if (lineChartTabSelected && this.revision <= 0) {  this.make_chart() }
    }, 
    error => {
      console.error('an error occured when checking if url parsed: ', error)
    })

    this.queryProfviewService.changeStatParams.subscribe( (msg: string) => {
      this.statParams = this.queryProfviewService.statParams
    }, 
    error => {
      console.error('an error occured when listening to changeStatParams: ', error)
    })

  }

  // clicking a new tab opens to the corresponding profile.
  on_select(points: any): void {
    const xidx = points.pointNumber
    const profile_id = points.data['profile_ids'][xidx]
    const url = '/catalog/profiles/' + profile_id + '/bgcPage'
    window.open(url,'_blank')
  } 

  make_chart(): void {
    this.getProfileService.get_platform_data(this.platform_number, [this.chartLabels.x2, this.chartLabels.x1]).subscribe( (profileData: BgcProfileData[] | CoreProfileData[] | any) => {
      this.profileData = profileData
      this.set_chart(this.profileData)
      this.revision += 1;
    },
    error => {
      console.error('an error occured when making chart: ', error)
    })
  }

  set_chart(profileData: BgcProfileData[] | CoreProfileData[]) {
    const xParams = this.chartService.get_trace_params(this.chartLabels.x1)
    const yParams = this.chartService.get_trace_params(this.chartLabels.x2)
    this.layout = this.chartService.make_line_layout(this.chartLabels.x1, this.chartLabels.x2)

    const dataArrays = this.chartService.make_line_chart_data_arrays(profileData, this.chartLabels.x2, this.chartLabels.x1, this.measKey, this.reduceMeas, this.statParamKey, this.bgcPlatform)
    const trace = this.chartService.make_line_chart_trace(dataArrays, this.chartLabels.x1, this.bgcPlatform, xParams['units'], yParams['units'])
    this.graph = { data: trace,
      layout: this.layout,
      updateOnlyWithRevision: true
    }
  }


  y_label_change(yLabel: string): void {
    this.chartLabels.x2 = yLabel
    this.graph = false // destroy plotly-plot element and rebuild it entirely. needed for some browsers (ahem, chrome) don't update colorbar.
    this.make_chart()
    this.queryProfviewService.set_chart_labels(this.id, this.chartLabels)
    this.queryProfviewService.set_url()
  }

  x_label_change(xLabel: string): void {
    this.chartLabels.x1 = xLabel
    this.graph = false // destroy plotly-plot element and rebuild it entirely. needed for some browsers (ahem, chrome) don't update colorbar.
    this.make_chart()
    this.queryProfviewService.set_chart_labels(this.id, this.chartLabels)
    this.queryProfviewService.set_url()
  }

  download_chart_data(): void {
    let url = '/catalog/bgc_platform_data/'
    url += this.platform_number 
    url += '?meas_1=' + this.chartLabels.x1
    url += '&meas_2=' + this.chartLabels.x2
    window.open(url,'_blank')
  }
}
