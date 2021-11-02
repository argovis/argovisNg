import { Component, OnInit, Input, AfterViewInit, OnChanges } from '@angular/core';
import { StationParameters } from '../profiles'
import { GetProfilesService } from '../get-profiles.service'
import { QueryProfviewService } from '../query-profview.service';
import { Subscription } from 'rxjs/Subscription';
import { DataexchangeService } from "../dataexchange.service"

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
      this.make_chart()
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

  make_chart(): void {
    this.getProfileService.get_platform_data(this.platform_number, [this.xAxis, this.yAxis, this.zAxis]).subscribe( (profileData: any) => {
      // pack data
      let data = profileData.map(p => {
            return {
              type: 'scatter', 
              mode: 'markers',
              name: p['_id'],
              x: p.bgcMeas.map(x => x[this.xAxis]),
              y: p.bgcMeas.map(y => y[this.yAxis]),
              marker: {color: p.bgcMeas.map(z => z[this.zAxis]), colorscale: 'Viridis'}
            }
          })
      data = data.filter(d => this.activePlots.includes(d.name))
      // set marker shape 
      for(let i=0; i<data.length; i++){
        data[i].marker.symbol = this.symbols[i%this.symbols.length]
      }
      // update graph on change
      this.graph = {
        data: data,
        layout: this.generate_layout()
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

  generate_layout(): any {
    let layout = {
          height:300, 
          width: 300,
          margin: {
            l: 5,
            r: 5,
            b: 25,
            t: 25,
            pad: 5
          },
          yaxis: {
              showticklabels: true,
              autorange: true,
              type: "linear", 
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
        }

    return layout
  }

}
