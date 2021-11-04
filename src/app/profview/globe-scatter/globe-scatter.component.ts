import { Component, OnInit } from '@angular/core';
import { QueryProfviewService } from '../query-profview.service';
import { ProfileMeta } from '../profiles'
@Component({
  selector: 'app-globe-scatter',
  templateUrl: './globe-scatter.component.html',
  styleUrls: ['./globe-scatter.component.css']
})
export class GlobeScatterComponent implements OnInit {

  constructor(private queryProfviewService: QueryProfviewService) { }
  public graph: any

  ngOnInit(): void {
    let dataArrays = {lats: [], lon: [], ids: [], date: [], cycle: [], qc: []}
    this.queryProfviewService.profileMetaChanged.subscribe((msg: string) => {
      const metaData = this.queryProfviewService.profileMeta
      metaData.forEach( (profileMeta: ProfileMeta) => {
        dataArrays.lats.push(profileMeta.lat)
        dataArrays.lon.push(profileMeta.lon)
        dataArrays.ids.push(profileMeta._id)
        dataArrays.date.push(profileMeta.date)
        dataArrays.qc.push(profileMeta.position_qc)
        dataArrays.cycle.push(profileMeta.cycle_number)
      } )
      this.graph = this.make_map(dataArrays.ids, dataArrays.lats, dataArrays.lon, dataArrays.date, dataArrays.cycle, dataArrays.qc)
    })
  }

  make_hovor_chart_text(_id: string, lat: number, lon: number, date: string, cycle: number, qc: number): string {
    let box = "<br>profile id: " + _id
    + "<br>latitude: " + lat.toFixed(3) 
    + "<br>longitude: " + lon.toFixed(3)
    + "<br>date: " + lon.toFixed(3)
    + "<br>cycle: " + cycle
    + "<br>position qc: " + qc
    return box
  }

  public on_select(text: string) {
    console.log('text', text)
    const profile_id = text.split('id: ').pop().split('<br>')[0]
    const url = '/catalog/profiles/' + profile_id + '/bgcPage';
    window.open(url,'_blank');
  }

  private make_map(ids, lats, longs, dates, cycles, qcs) {
    const minLong = Math.min(...longs)
    const maxLong = Math.max(...longs)
    const longRange = [minLong-5, maxLong+5]
    const latRange = [Math.min(...lats)-7, Math.max(...lats)+7]

    let hovorText = []
    for (let idx=0; idx<ids.length; ++idx){
      const txt = this.make_hovor_chart_text(ids[idx], lats[idx], longs[idx], dates[idx], cycles[idx], qcs[idx])
      hovorText.push(txt)
    }

    let midLong =  minLong + 5 //just make sure some of the points are in range
    if (longs.length === 1) {
        midLong = longs[0]
    }
    const midLat = (latRange[1] + latRange[0])/2
    const data = [{
        type: 'scattergeo',
        mode: 'markers',
        text: hovorText,
        hoverinfo: 'text',
        lon: longs,
        lat: lats,
        profile_ids: ids,
        marker: {
            color: cycles,
            size: 7,
            width: 1,
            autocolorscale: false,
            colorscale: 'Greys'
            },
    }];

    const layout = {
        width:200,
        titlefont: {
            size: 16
        },
        margin: {
          l: 5,
          r: 5,
          b: 5,
          t: 5,
          pad: 5
        },
        geo: {
        projection: {
            type: 'orthographic',
            rotation: {
                lon: midLong,
                lat: midLat
            },
        },
            resolution: 50,
            lonaxis: {
                'range': longRange
            },
            lataxis: {
                'range': latRange
            },
            showland: true,
            showocean: true,
            landcolor: '#EAEAAE',
            oceancolor: 'LightBlue',
            countrycolor: '#d3d3d3',
            countrywidth: 1.5,
            subunitcolor: '#d3d3d3'
        }
    };

    return ({data: data, layout: layout})
}

}
