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
  @Input() width: any
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
  public colorscales: string[]
  public currentColor: string
  public pidmap
  public catIndex

  constructor(private getProfileService: GetProfilesService,
              private queryProfviewService: QueryProfviewService,
              public exchange: DataexchangeService) { }

  ngOnInit(): void {
    this.symbols = ['circle', 'square', 'diamond', 'triangle-up', 'x', 'cross', 'pentagon', 'triangle-down', 'triangle-left', 'triangle-right']
    this.activePlots = []
    this.cmin = 0
    this.cmax = 1000
    this.colorscales = ["Blackbody","Bluered","Blues","Earth","Electric","Greens","Greys","Hot","Jet","Picnic","Portland","Rainbow","RdBu","Reds","Viridis","YlGnBu","YlOrRd"]
    this.currentColor = 'Viridis'
    this.pidmap = {}
    this.catIndex = 0

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

  colorscale_change(colorscale: string): void {
    this.currentColor = colorscale
    this.suspendcminDetection = true
    this.suspendcmaxDetection = true
    this.make_chart()
  }

  on_select(event: any): void {
    if(event.event.shiftKey){
      const url = 'https://argovis.colorado.edu/catalog/profiles/' + event['points'][0]['data']['name'] + '/bgcPage'
      window.open(url,'_blank')
    }
  }

  make_chart(): void {
    this.getProfileService.get_platform_data(this.platform_number, [this.xAxis, this.yAxis, this.zAxis]).subscribe( (profileData: any) => {
      // filter off anything we don't want to plot
      let data = profileData.filter(d => this.activePlots.includes(d['_id']))
      
      // get the map of pids if necessary
      this.pidmap = {}
      this.catIndex = 0
      if(this.zAxis == 'profileID') profileData.map(d => this.create_pidmap(d['_id']))

      // pack data
      let minZ = []
      let maxZ = []
      data = data.map(p => {
            // pack data, and use it to make sensible decisions on how to set the colorscale limits.
            let x = this.pack_xy(p, 'xAxis')
            let y = this.pack_xy(p, 'yAxis')
            let z = this.pack_z(p)
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
              text: this.generate_tooltip(p, x,y,z),
              hoverinfo: 'text',
              x: x,
              y: y,
              marker: {color: z,
                       colorscale: this.currentColor,
                       title: this.zAxis
                      }
            }
      })

      // append the colorscale calibration info based on global max/min across all profiles
      // also handle special z axes
      if(!this.suspendcminDetection) this.cmin = Math.min(...minZ)
      if(!this.suspendcmaxDetection) this.cmax = Math.max(...maxZ)
      data = data.map( d => {
        d.marker.cmin = this.cmin
        d.marker.cmax = this.cmax
        d.marker.colorbar = {thickness: 10, title: this.zAxis}
        if(this.zAxis == 'time'){
          d.marker.colorbar.tickmode = 'array'
          d.marker.colorbar.tickvals = [this.cmin, (this.cmax - this.cmin)/2 + this.cmin, this.cmax]
          d.marker.colorbar.ticktext = d.marker.colorbar.tickvals.map(time => new Date(time).toISOString().split('T')[0])
          d.marker.colorbar.tickangle = 30
         }
        if(this.zAxis == 'profileID'){
          d.marker.colorbar = null
         }
        return d
      })

      this.suspendcminDetection = false
      this.suspendcmaxDetection = false
      // set marker shape 
      for(let i=0; i<data.length; i++){
        if(data.length <= 10){
          data[i].marker.symbol = this.symbols[i%this.symbols.length]
        } else {
          data[i].marker.symbol = 'circle'
        }
      }
      // update graph on change
      this.graph = {
        data: data,
        layout: this.generate_layout(this.yAxis.includes('pres'), data.length <= 10)
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

  generate_layout(reverseY: boolean, showlegend: boolean): any {
    let layout = {
          height:300, 
          width: this.width,
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
          showlegend: showlegend,
          legend: {
            x: 1.4,
            y: 1
          }
        }


    return layout
  }

  pack_xy(p: any, axis: string){
    // pack the data for the x or y axis meant to be used in the data.x or data.y keys of the plotly object.
    // p == profile object as returned by getProfileService.get_platform_data
    // axis == 'xAxis' or 'yAxis'.

    if(this[axis] == 'time'){
      return Array(p.bgcMeas.length).fill(p.date)
    } else if (this[axis] == 'latitude'){
      return Array(p.bgcMeas.length).fill(p.geoLocation.coordinates[1])
    } else if (this[axis] == 'longitude'){
      return Array(p.bgcMeas.length).fill(p.geoLocation.coordinates[0])
    } else if (this[axis] == 'profileID'){
      return Array(p.bgcMeas.length).fill(p._id)
    } else {
      // catchall for bgc variables
      return p.bgcMeas.map(i => i[this[axis]])
    }
  }

  pack_z(p: any){
    // pack the data for the z axis meant to be used in the data.marker.color key of the plotly object.
    // p == profile object as returned by getProfileService.get_platform_data

    let d = new Date(p.date)

    if(this.zAxis == 'time'){
      return Array(p.bgcMeas.length).fill(d.getTime())
    } else if (this.zAxis == 'latitude'){
      return Array(p.bgcMeas.length).fill(p.geoLocation.coordinates[1])
    } else if (this.zAxis == 'longitude'){
      return Array(p.bgcMeas.length).fill(p.geoLocation.coordinates[0])
    } else if (this.zAxis == 'profileID'){
      return Array(p.bgcMeas.length).fill(this.pidmap[p._id])
    } else {
      // catchall for bgc variables
      return p.bgcMeas.map(i => i[this.zAxis])
    }
  }

  create_pidmap(id){
    // when plotting profile IDs on the color axis, need to map pids onto a numerical index.
    if(id in this.pidmap) return this.pidmap[id]
      else {
        this.pidmap[id] = this.catIndex
        this.catIndex++
        return this.pidmap[id]  
      }
  }

  generate_tooltip(p, x, y, z): string[] {
    let data = x.map(function(d, i){
      return [this.stringify_data(this.xAxis, d),
              this.stringify_data(this.yAxis, y[i]),
              this.stringify_data(this.zAxis, z[i])]
    }, this)
    let text = data.map(d => {
      return "<b>Profile " + p._id + "</b><br>"
    + this.xAxis + ": " + d[0] + "<br>"
    + this.yAxis + ": " + d[1] + "<br>"
    + this.zAxis + ": " + d[2] + "<br>"
    + "Hold shift and click to open profile page."     
    })

    return text
  }

  stringify_data(variable, value){
    if(variable == 'time') return new Date(value).toUTCString()
    else if (typeof value == 'number') return value.toFixed(2)
    else return value
  }
}