import { Component, OnInit, Input, AfterViewInit, OnChanges} from '@angular/core';
import { StationParameters } from '../profiles'
import { GetProfilesService } from '../get-profiles.service'
import { QueryProfviewService } from '../query-profview.service';
import { Subscription } from 'rxjs/Subscription';
import { DataexchangeService } from "../dataexchange.service"
import { NotifierService } from 'angular-notifier'

@Component({
  selector: 'app-varplot',
  templateUrl: './varplot.component.html',
  styleUrls: ['./varplot.component.css']
})
export class VarplotComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() defaultX: any
  @Input() defaultY: any
  @Input() defaultZ: any
  public platform_number: string
  public xAxis: string
  public yAxis: string
  public zAxis: string
  public cmin: number
  public cmax: number
  public suspendcmaxDetection: boolean
  public suspendcminDetection: boolean
  public statParams: StationParameters[]
  public graph: any
  public symbols: any
  public tableSubscription: any
  public activePlots: string[]

  constructor(private getProfileService: GetProfilesService,
              private queryProfviewService: QueryProfviewService,
              public exchange: DataexchangeService) { }

  ngOnInit(): void {
    this.symbols = ['circle', 'square', 'diamond', 'triangle-up', 'x']
    this.activePlots = []
    this.cmin = 0
    this.cmax = 1000

    this.queryProfviewService.urlParsed.subscribe( (msg: string) => {
      this.platform_number = this.queryProfviewService.platform_number
    }, 
    error => {
      console.error('an error occured when checking if url parsed: ', error)
    })

    this.queryProfviewService.changeStatParams.subscribe( (msg: string) => {
      // find out what station parameters we have, populate the dropdowns, and make sure the defaults make sense
      this.statParams = this.queryProfviewService.statParams
      this.xAxis = this.choose_defaults(this.defaultX)
      this.yAxis = this.choose_defaults(this.defaultY)
      this.zAxis = this.choose_defaults(this.defaultZ)
    }, 
    error => {
      console.error('an error occured when listening to changeStatParams: ', error)
    })

    this.tableSubscription = this.exchange.getData().subscribe(message => {
      if(message.checked){
        // add plot
        this.activePlots.indexOf(message.id) == -1 ? this.activePlots.push(message.id) : null;
      } else{
        // remove plot
        this.activePlots = this.activePlots.filter(id => id !== message.id);
      }
      this.make_chart();
    });
  }

  ngAfterViewInit() {
    return
  }

  ngOnChanges() {
    return
  }

  x_change(x: string): void {
    this.make_chart()
  }

  y_change(y: string): void {
    // reverse y axis iff plotting pressure
    // if(y.includes('pres')) {
    //   this.graph.layout.yaxis.autorange = 'reversed'
    // } else {
    //   this.graph.layout.yaxis.autorange = true
    // }

    this.make_chart()
  }

  z_change(z: string): void {
    this.make_chart()
  }

  z_min_change(cmin: number): void {
    this.cmin = cmin
    this.suspendcminDetection = true
    this.suspendcmaxDetection = true
    this.make_chart()
  }

  z_max_change(cmax: number): void {
    this.cmax = cmax
    this.suspendcminDetection = true
    this.suspendcmaxDetection = true
    this.make_chart()
  }

  make_chart(): void {
    this.getProfileService.get_platform_data(this.platform_number, [this.xAxis, this.yAxis, this.zAxis]).subscribe( (profileData: any) => {
      // filter off anything we don't want to plot
      let data = profileData.filter(d => this.activePlots.includes(d['_id']))
      let minZ = []
      let maxZ = []
      // pack data
      data = data.map(p => {
            // pack color axis data, and use it to make sensible decisions on how to set the colorscale limits.
            let d = new Date(p.date)
            let z = this.zAxis=='time' ? Array(p.bgcMeas.length).fill(d.getTime()/1000) : p.bgcMeas.map(z => z[this.zAxis])
            if(!this.suspendcminDetection){
              minZ.push(+(Math.min(...z.filter(zz => typeof zz === 'number' && isFinite(zz))).toFixed(2)))
            }
            if(!this.suspendcmaxDetection) {
              maxZ.push(+(Math.max(...z.filter(zz => typeof zz === 'number' && isFinite(zz))).toFixed(2)))
            }
            return {
              type: 'scatter', 
              mode: 'markers',
              name: p['_id'],
              x: this.xAxis=='time' ? Array(p.bgcMeas.length).fill(p.date) : p.bgcMeas.map(x => x[this.xAxis]),
              y: this.yAxis=='time' ? Array(p.bgcMeas.length).fill(p.date) : p.bgcMeas.map(y => y[this.yAxis]),
              marker: {color: z,
                       colorscale: 'Viridis',
                       title: this.zAxis
                      }
            }
      })
      // append the colorscale calibration info based on global max/min across all profiles
      if(!this.suspendcminDetection) this.cmin = Math.min(...minZ)
      if(!this.suspendcmaxDetection) this.cmax = Math.max(...maxZ)
      data = data.map( d => {
        d.marker.cmin = this.cmin
        d.marker.cmax = this.cmax
        d.marker.colorbar = {thickness: 10, title: this.zAxis}
        if(this.zAxis == 'time'){
          d.marker.colorbar.tickmode = 'array'
          d.marker.colorbar.tickvals = [this.cmin, (this.cmax - this.cmin)/2 + this.cmin, this.cmax]
          d.marker.colorbar.ticktext = d.marker.colorbar.tickvals.map(time => new Date(time*1000).toISOString().split('T')[0])
          d.marker.colorbar.tickangle = 30
         }
        return d
      })

      this.suspendcminDetection = false
      this.suspendcmaxDetection = false
      // set marker shape 
      for(let i=0; i<data.length; i++){
        data[i].marker.symbol = this.symbols[i%this.symbols.length]
      }
      // update graph on change
      this.graph = {
        data: data,
        layout: this.generate_layout(this.yAxis.includes('pres'))
      }
    },
    error => {
      console.error('an error occured when making chart: ', error)
    })
  }

  choose_defaults(variable: string): string {
    // defaults set in the HTML might not actually exist for this platform; try to make a reasonable guess.
    let sp = this.statParams.map(x => x.value)
    if(sp.includes(variable)) return variable;
    else if (sp.includes(variable + '_btl')) return variable + '_btl';
    else if (sp.includes(variable + '_ctd')) return variable + '_ctd';
    else return variable
  }

  generate_layout(reverseY: boolean): any {
    let layout = {
          height:300, 
          width: 450,
          margin: {
            l: 5,
            r: 5,
            b: 25,
            t: 25,
            pad: 5
          },
          yaxis: {
              autorange: reverseY ? 'reversed' : true, 
              title: this.yAxis,
              automargin: true,
          },
          xaxis: {
              autorange: true, 
              title: this.xAxis,
              automargin: true,
          }, 
          hovermode: "closest", 
          showlegend: true,
          legend: {
            x: 1.4,
            y: 1
          }
        }


    return layout
  }

}
