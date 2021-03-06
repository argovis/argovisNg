import { Component, OnInit, Input, AfterViewInit, OnChanges} from '@angular/core';
import { StationParameters } from '../profiles'
import { GetProfilesService } from '../get-profiles.service'
import { QueryProfviewService } from '../query-profview.service';
import { Subscription } from 'rxjs';
import { DataexchangeService } from "../dataexchange.service"
import { NotifierService } from 'angular-notifier'
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-varplot',
  templateUrl: './varplot.component.html',
  styleUrls: ['./varplot.component.css']
})
export class VarplotComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() width: any
  @Input() tag: any
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
      // check URL for state variables and populate; 
      //only x,y,z for each graph is mandatory, everything else can be autodetected if absent.
      if(this.queryProfviewService.state.profiles) this.activePlots = this.queryProfviewService.state.profiles.split(',')
      this.xAxis = this.queryProfviewService.state[this.tag]['x']
      this.yAxis = this.queryProfviewService.state[this.tag]['y']
      this.zAxis = this.queryProfviewService.state[this.tag]['z']
      if(this.queryProfviewService.state[this.tag]['cmin']){
        this.cmin = Number(this.queryProfviewService.state[this.tag]['cmin'])
        this.suspendcminDetection = true
      }
      if(this.queryProfviewService.state[this.tag]['cmax']){
        this.cmax = Number(this.queryProfviewService.state[this.tag]['cmax'])
        this.suspendcmaxDetection = true
      }
      if(this.queryProfviewService.state[this.tag]['currentColor']){
        this.currentColor = this.queryProfviewService.state[this.tag]['currentColor']
        this.suspendcminDetection = true
        this.suspendcmaxDetection = true
      }
    }, 
    error => {
      console.error('an error occured when checking if url parsed: ', error)
    })

    this.queryProfviewService.changeStatParams.subscribe( (msg: string) => {
      // find out what station parameters we have, populate the dropdowns, and make sure the defaults make sense
      this.statParams = this.queryProfviewService.statParams
      this.xAxis = this.choose_defaults(this.xAxis)
      this.yAxis = this.choose_defaults(this.yAxis)
      this.zAxis = this.choose_defaults(this.zAxis)
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
      this.queryProfviewService.set_map_state('profiles', this.activePlots.join(','))
      this.queryProfviewService.set_url()
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
    this.queryProfviewService.set_map_state('x'+this.tag, x)
    this.queryProfviewService.set_url()
    this.make_chart()
  }

  y_change(y: string): void {
    this.queryProfviewService.set_map_state('y'+this.tag, y)
    this.queryProfviewService.set_url()
    this.make_chart()
  }

  z_change(z: string): void {
    this.queryProfviewService.set_map_state('z'+this.tag, z)
    this.queryProfviewService.set_url()
    this.make_chart()
  }

  z_min_change(cmin: number): void {
    this.cmin = cmin
    this.queryProfviewService.set_map_state('cmin'+this.tag, String(cmin))
    this.queryProfviewService.set_url()
    this.suspendcminDetection = true
    this.suspendcmaxDetection = true
    this.make_chart()
  }

  z_max_change(cmax: number): void {
    this.cmax = cmax
    this.queryProfviewService.set_map_state('cmax'+this.tag, String(cmax))
    this.queryProfviewService.set_url()
    this.suspendcminDetection = true
    this.suspendcmaxDetection = true
    this.make_chart()
  }

  colorscale_change(colorscale: string): void {
    this.currentColor = colorscale
    this.queryProfviewService.set_map_state('currentColor'+this.tag, colorscale )
    this.queryProfviewService.set_url()
    this.suspendcminDetection = true
    this.suspendcmaxDetection = true
    this.make_chart()
  }

  on_select(event: any): void {
    if(event.event.shiftKey){
      const url = environment.dpRoot + '/catalog/profiles/' + event['points'][0]['data']['name'] + '/bgcPage'
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
      if(!this.suspendcminDetection) {
        this.cmin = Math.min(...minZ)
        this.queryProfviewService.set_map_state('cmin'+this.tag, String(this.cmin))
        this.queryProfviewService.set_url()
      }
      if(!this.suspendcmaxDetection) {
        this.cmax = Math.max(...maxZ)
        this.queryProfviewService.set_map_state('cmax'+this.tag, String(this.cmax))
        this.queryProfviewService.set_url()
      }
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
        layout: this.generate_layout(this.yAxis.includes('pres'), data.length <= 10),
        // config adds / removes modbar buttons
        config: {
          modeBarButtonsToRemove: ['resetScale2d'],
          modeBarButtonsToAdd: [{
            name: 'Home Axes',
            icon: {
              'width': 500,
              'height': 600,
              'path': 'm786 296v-267q0-15-11-26t-25-10h-214v214h-143v-214h-214q-15 0-25 10t-11 26v267q0 1 0 2t0 2l321 264 321-264q1-1 1-4z m124 39l-34-41q-5-5-12-6h-2q-7 0-12 3l-386 322-386-322q-7-4-13-4-7 2-12 7l-35 41q-4 5-3 13t6 12l401 334q18 15 42 15t43-15l136-114v109q0 8 5 13t13 5h107q8 0 13-5t5-13v-227l122-102q5-5 6-12t-4-13z',
              'transform': "matrix(0.7 0 0 -0.7 -100 600)" 
            },
            click: function(gd) {
              this.make_chart()
            }.bind(this)
          }]
        }
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