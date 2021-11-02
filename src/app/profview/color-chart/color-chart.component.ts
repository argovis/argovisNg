import { Component, OnInit, Input, Output } from '@angular/core';
import { BgcProfileData, CoreProfileData, StationParameters, ColorScaleSelection } from './../profiles'
import { GetProfilesService } from './../get-profiles.service'
import { ChartService } from './../chart.service'
import { QueryProfviewService } from '../query-profview.service';

@Component({
  selector: 'app-color-chart',
  templateUrl: './color-chart.component.html',
  styleUrls: ['./color-chart.component.css']
})
export class ColorChartComponent implements OnInit {

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
  public colorscaleSelections: ColorScaleSelection[] =  this.chartService.colorscaleSelections
  public cmapName: string
  public yAxisTitle: string
  public colorLabel: string
  @Input() id: string
  public yLabel: string = 'pres'
  public revision: number = 0
  public readonly reduceMeas = 200
  @Output() colorbarDomain: [number, number] = [0, 1]
  @Output() colorscale: [number, string][] = this.chartService.getColorScale('thermal')

  ngOnInit(): void {
    this.queryProfviewService.urlParsed.subscribe( (msg: string) => {
      this.colorLabel = this.queryProfviewService[this.id] 
      this.statParamKey = this.queryProfviewService.statParamKey
      this.platform_number = this.queryProfviewService.platform_number
      this.measKey = this.queryProfviewService.measKey
      this.bgcPlatform = this.queryProfviewService.bgcPlatform


      const colorTabSelected = !Boolean(this.queryProfviewService.selectedIndex)
      if (colorTabSelected && this.revision <= 0) {  this.make_chart() }

      const yParams = this.chartService.get_trace_params(this.yLabel)
      this.yAxisTitle = yParams.title
    }, 
    error => {
      console.error('an error occured when checking if url parsed: ', error)
    })

    this.queryProfviewService.changeStatParams.subscribe( (msg: string) => {
      let statParams = this.queryProfviewService.statParams
      statParams = statParams.filter( params => params.value !== 'pres') // filter out pressure
      this.statParams = statParams
    }, 
    error => {
      console.error('an error occured when listening to changeStatParams: ', error)
    })
  }

  // Upon click a new tab opens to the corresponding profile.
  on_select(points: any): void {
    const xidx = points.pointNumber
    const profile_id = points.data['profile_ids'][xidx]
    const url = '/catalog/profiles/' + profile_id + '/bgcPage'
    window.open(url,'_blank')
  } 

  make_chart(): void {
    this.getProfileService.get_platform_data(this.platform_number, [this.yLabel, this.colorLabel]).subscribe( (profileData: BgcProfileData[] | CoreProfileData[] | any) => {
      this.profileData = profileData
      const defaultColorScale = true
      this.set_chart(this.profileData, defaultColorScale)
      this.revision += 1;
    },
    error => {
      console.error('an error occured when making chart: ', error)
    })
  }

  set_chart(profileData: BgcProfileData[] | CoreProfileData[], defaultColorScale=false, defaultColorbarDomain=true) {
    const colorParams = this.chartService.get_trace_params(this.colorLabel)
    this.layout = this.chartService.makeLayout(this.yAxisTitle)
    this.chartTitle = colorParams.title
    let cmapName = colorParams.cmapName
    if (defaultColorScale) { 
      this.cmapName = colorParams.cmapName 
    }
    else {
      cmapName = this.cmapName
    }
    const dataArrays = this.chartService.makeColorChartDataArrays(profileData, this.yLabel, this.colorLabel, this.measKey, this.reduceMeas, this.statParamKey, this.bgcPlatform)
    if (defaultColorbarDomain || !this.colorbarDomain){
      this.colorbarDomain = this.getMinMax(dataArrays['x1'])
    }
    this.colorscale = this.chartService.getColorScale(cmapName)
    const trace = this.chartService.makeColorChartTrace(dataArrays, colorParams.units, cmapName, this.colorLabel, this.bgcPlatform, this.colorbarDomain)

    this.graph = { data: trace,
      layout: this.layout,
      updateOnlyWithRevision: true
    }
  }

  getMinMax(darray: number[], round=1): [number, number] {
    let min = Math.min(...darray)
    let max = Math.max(...darray)

    min = parseFloat(Number(min).toFixed(round))
    max = parseFloat(Number(max).toFixed(round))
    return [min, max]
  }

  cLabelChange(colorLabel: string): void {
    this.colorLabel = colorLabel
    this.queryProfviewService[this.id] = this.colorLabel
    this.graph = false // destroy plotly-plot element and rebuild it entirely. needed for some browsers (ahem, chrome) don't update colorbar.
    this.make_chart()
    this.queryProfviewService.set_url()
  }

  colorscaleChange(cmapName: string): void {
    this.cmapName = cmapName
    const defaultColorScale = false
    const defaultColorbarDomain = false
    this.set_chart(this.profileData, defaultColorScale, defaultColorbarDomain)
    this.revision += 1;
  }

  updateDomain(domain: [number, number]): void {
    this.colorbarDomain = domain
    const defaultColorScale = false
    const defaultColorbarDomain = false
    this.set_chart(this.profileData, defaultColorScale, defaultColorbarDomain)
    this.revision += 1
  }

  download_chart_data(): void {
    let url = '/catalog/bgc_platform_data/'
    url += this.platform_number 
    url += '?meas_2=' + this.yLabel
    url += '&meas_1=' + this.colorLabel
    window.open(url,'_blank')
  }
  
  resetColorbarScale(): void {
    const defaultColorScale = true
    const defaultColorbarDomain = true
    this.set_chart(this.profileData, defaultColorScale, defaultColorbarDomain)
    this.revision += 1
  }
}
