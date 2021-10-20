import { TcQueryService } from './tc-query.service';
import { StormPopupComponent } from './storm-popup/storm-popup.component';
import { PointsService } from '../home/services/points.service';
import { Injectable, ApplicationRef, Injector } from '@angular/core';
import * as moment from 'moment';
import * as L from 'leaflet';
import { Observable, of } from 'rxjs';
import { TcTrack, TrajData } from '../models/tc-shape'
import { environment } from '../../environments/environment';
import { carlotta } from './tc-track.parameters'

@Injectable({
  providedIn: 'root'
})
export class TcTrackService extends PointsService {

  public appRef: ApplicationRef;
  public selectedTrackInfo: TcTrack
  public selectedTrack: any;

  constructor(public injector: Injector, public tcQueryService: TcQueryService) { super(injector) }

  init(appRef: ApplicationRef): void {
    this.appRef = appRef;
    this.compileService.configure(this.appRef);
  }

  public stormIcon = L.icon({
    iconUrl: 'assets/img/42681-cyclone-icon.png',
    iconSize:     [24, 24], 
    iconAnchor:   [12, 12],
    popupAnchor:  [0, 0]
  })

  public get_mock_tc(): Observable<TcTrack[]> {
    return of(carlotta);
  }

  public get_tc_tracks_by_date_range(startDate: moment.Moment, endDate: moment.Moment): Observable<TcTrack[]> {
    let url =  environment.apiRoot + `/tc?startDate=${startDate.format('YYYY-MM-DDTHH:mm:ss')}&endDate=${endDate.format('YYYY-MM-DDTHH:mm:ss')}`
    return this.http.get<TcTrack[]>(url)
  }

  public get_tc_tracks_by_name_year(name: string, year: string): Observable<TcTrack[]> {
    let url =  environment.apiRoot + `/tc?name=${name}&year=${year}`
    return this.http.get<TcTrack[]>(url)
  }

  public get_storm_names(): Observable<string[]> {
    return this.http.get<string[]>( environment.apiRoot + '/tc/stormNameList')
  }

  public make_wrapped_latLngs(latLngs: number[][]): number[][][] {
    let wraps = new Set()
    latLngs.forEach( (lat, lng) => {
      if (-90 > lng && lng > -180) { //duplicate to the right
        wraps.add(1)
      }
      else if (90 > lng && lng < 180) { //duplicate to the left
        wraps.add(-1)
      }
    })

    let wrappedLngLats = [latLngs]
    wraps.forEach( (sign: number) => {
      const wll = latLngs.map( x => [x[0], x[1] + 360 * sign])
      wrappedLngLats.push(wll)
    })

    return wrappedLngLats
  }


  public anti_meridian_transform(latLngs: number[][]): number[][] {
    //if tc has lon range > 270, assume tc crosses antimeridian
    const lngs = latLngs.map( (latLng: number[]) => { return latLng[1]; });
    const lonMax = lngs.reduce((a, b) => Math.max(a, b))
    const lonMin = lngs.reduce((a, b) => Math.min(a, b))
    const lonRange = lonMax - lonMin
    if (lonRange > 270) {
      latLngs.forEach( (latLng: number[]) => {
        if (latLng[1] >= 0) {
          latLng[1] -= 360
        }
      })
    }
  
    return latLngs
  }

  public add_to_track_layer(track: TcTrack, trackLayer: L.LayerGroup): L.LayerGroup {
    let trajDataArr: TrajData[] = track['traj_data']
    let name = track['name']
    if (!name) {
      name = 'UNNAMED'
    }
    const source = track['source']
    let latLngs = []
    for (let idx=0; idx<trajDataArr.length; ++idx) {
      const trajData = trajDataArr[idx]
      const lat = trajData['lat']
      const lon = trajData['lon']
      latLngs.push([lat, lon])
      const date = moment.utc(trajData['timestamp']).format('LLLL')
      const strLatLng = this.format_lat_lng([lon, lat])
      const catagory = trajData['class']
      const geoLocation = trajData['geoLocation']
      const wind = trajData['wind']
      const pres = trajData['pres']
      const coordArray = this.make_wrapped_lng_lat_coordinates(geoLocation.coordinates);
      for(let jdx=0; jdx<coordArray.length; jdx++) {
        let marker;
        const latLngCoords = [coordArray[jdx][1], coordArray[jdx][0]] as [number, number]
        marker = L.marker(latLngCoords, {icon: this.stormIcon});
        marker.bindPopup(null);
        marker.on('click', (event) => {
          marker.setPopupContent(
                this.compileService.compile(StormPopupComponent, (c) => 
                  { 
                    c.instance.name = name
                    c.instance.source = source
                    c.instance.catagory = catagory
                    c.instance.lat = strLatLng[0]
                    c.instance.lon = strLatLng[1]
                    c.instance.date = date
                    c.instance.wind = wind
                    c.instance.pres = pres
                  })
            );
      })
      trackLayer.addLayer(marker);
      }
    }
    latLngs = this.anti_meridian_transform(latLngs)
    const wrappedLatLngs = this.make_wrapped_latLngs(latLngs)
    for(let jdx = 0; jdx<wrappedLatLngs.length; jdx++){
      let pl = L.polyline(wrappedLatLngs[jdx] as L.LatLngExpression[]) as any
      pl['name'] = name
      pl['startDate'] = track['startDate']
      pl['endDate'] = track['endDate']
      pl.on('mousedown', (event) => {
        console.log(track['startDate'], track['endDate'], track['_id'], pl._leaflet_id)
        let lTrack = track
        lTrack['leaflet_id'] = pl._leaflet_id
        this.selectedTrack = lTrack
      });
      trackLayer.addLayer(pl)
    }
    return trackLayer
  }
  public get_selected_track(): TcTrack {
    return this.selectedTrack
  }

}
