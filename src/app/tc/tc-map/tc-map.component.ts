import { Component, OnInit, Injector } from '@angular/core'
import { MapComponent } from './../../home/map/map.component'
import { TcQueryService } from './../tc-query.service'
import { TcMapService } from './../tc-map.service'
import { TcTrackService } from './../tc-track.service'
import { TcTrack, TrajData } from '../../models/tc-shape'
import { ProfilePoints } from '../../models/profile-points'
import * as moment from 'moment'

import * as L from "leaflet"
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable'
@Component({
  selector: 'app-tc-map',
  templateUrl: './tc-map.component.html',
  styleUrls: ['./tc-map.component.css']
})
export class TcMapComponent extends MapComponent implements OnInit {
  private tcQueryService: TcQueryService
  private tcMapService: TcMapService
  private tcTrackService: TcTrackService

  constructor(public injector: Injector) { super(injector)
                                           this.tcQueryService = this.injector.get(TcQueryService)
                                           this.tcMapService = this.injector.get(TcMapService)
                                           this.tcTrackService = this.injector.get(TcTrackService)
                                         }

  ngOnInit() {
  this.pointsService.init(this.appRef)
  this.tcTrackService.init(this.appRef)
  this.tcMapService.init(this.appRef)
  this.set_params_and_events()
  this.proj = 'WM'
  this.wrapCoordinates = true
  // this.set_points_on_map()
  // this.set_mock_tc_tracks()
  this.set_tc_tracks_by_date_range()
  this.invalidate_size()
  }

  public set_map(): void {
    this.map = this.tcMapService.generate_map(this.proj)
    this.startView = L.latLng(15, -150)
    this.startZoom = 6
    this.map.setView(this.startView, this.startZoom)
    this.startView = this.map.getCenter()
    this.startZoom = this.map.getZoom()
    this.tcMapService.drawnItems.addTo(this.map) //polygons

    this.tcMapService.coordDisplay.addTo(this.map)
    this.tcMapService.globalTcTracks.addTo(this.map) //special shapes for global track objects
    this.tcMapService.selectedStorm.addTo(this.map) // selected storm has its own feature group
    this.tcMapService.scaleDisplay.addTo(this.map)
    // this.trackLayer.addTo(this.map)
    this.markersLayer.addTo(this.map)  
  }

  public set_params_and_events(): void { //  rewritten function is called in super.ngOnInit()
    this.set_map()
    this.tcQueryService.set_params_from_url()
    this.tcQueryService.set_url()

    this.tcQueryService.change
      .subscribe((msg: string) => {
        console.log('change emitted:', msg)
        if (msg.toLowerCase().includes('date')){ //clear tracks on date change
          this.tcMapService.globalTcTracks.clearLayers()
          this.tcMapService.selectedStorm.clearLayers()
        }
        this.markersLayer.clearLayers()
        this.set_points_on_tc_map()
        if (this.tcQueryService.get_global_storms_toggle()){
          this.set_tc_tracks_by_date_range()
        }
        // this.set_mock_tc_tracks()
        this.tcQueryService.set_url()
        })
    this.tcQueryService.clear_layers
      .subscribe( () => {
        this.markersLayer.clearLayers()
        this.tcMapService.globalTcTracks.clearLayers()
        this.tcMapService.selectedStorm.clearLayers()
        this.tcMapService.drawnItems.clearLayers()
        this.tcQueryService.set_url()
      })
    this.tcQueryService.resetToStart
      .subscribe( () => {
        this.markersLayer.clearLayers()
        this.tcMapService.globalTcTracks.clearLayers()
        this.tcMapService.selectedStorm.clearLayers()
        this.tcQueryService.clear_shapes()
        this.tcMapService.drawnItems.clearLayers()
        this.set_tc_tracks_by_date_range()
        // this.set_mock_tc_tracks()
        this.map.setView([this.startView.lat, this.startView.lng], this.startZoom)
        this.tcQueryService.set_url()

      })
    this.tcQueryService.stormSelectionEvent
      .subscribe( (stormNameYear: string) => {
        console.log('stormSelectionEvent emitted', stormNameYear)
        this.markersLayer.clearLayers()
        this.tcMapService.selectedStorm.clearLayers()
        this.tcMapService.globalTcTracks.clearLayers()
        this.tcQueryService.clear_shapes()
        if (stormNameYear.includes('-')) {
          this.set_tc_track_by_storm_name_year(stormNameYear)
        }
        this.tcQueryService.set_url()
      })
      
      this.map.on('draw:created', (event: any) => { //  had to make event any in order to deal with typings
        const drawnBuffer = event.layer as L.Polygon<any>

        const selectedTrack = this.tcTrackService.get_selected_track()
        this.tcQueryService.send_global_storms_msg(false, false) //drawing events always set global to false
        const globalStormToggle = this.tcQueryService.get_global_storms_toggle()
        if (!globalStormToggle) { this.tcMapService.globalTcTracks.clearLayers() }

        this.tcMapService.selectedStorm.clearLayers()
        this.markersLayer.clearLayers()
        this.tcMapService.markersLayer.clearLayers()
        this.tcMapService.drawnItems.clearLayers()
        this.tcQueryService.clear_shapes() // only want one shape at a time

        this.tcTrackService.add_to_track_layer(selectedTrack, this.tcMapService.selectedStorm)
        this.tcMapService.globalTcTracks.addLayer(drawnBuffer);

        this.tcMapService.buffer_popup_window_creation(drawnBuffer, this.tcMapService.drawnItems)
        let broadcast = true
        const toggleThreeDayOff = true
  
        const drawnItems = this.tcMapService.drawnItems.toGeoJSON().features
        let shapes = this.tcQueryService.get_shapes_from_features(drawnItems)
        shapes = this.tcQueryService.round_shapes(shapes)
        if (!globalStormToggle) { broadcast=false }
        this.tcQueryService.send_tc_shape(shapes, broadcast)
       });

      this.map.on('draw:deleted', (event: L.DrawEvents.Deleted) => {
       });
  
      this.map.on('draw:edited', (event: L.DrawEvents.Edited) => {
      });

    this.tcMapService.tcDrawControl.addTo(this.map);
  }

  private set_mock_tc_tracks() {
    const tcTracks = this.tcTrackService.get_mock_tc()
    tcTracks.subscribe((tcTracks: TcTrack[]) => {
      this.set_tc_tracks(tcTracks)
    })
  }

  private set_tc_tracks_by_date_range(): void {
    const [startDate, endDate] = this.tcQueryService.get_tc_date_range()
    const tcTracks = this.tcTrackService.get_tc_tracks_by_date_range(startDate, endDate)
    tcTracks.subscribe((tcTracks: TcTrack[]) => {
      this.set_tc_tracks(tcTracks)
    })
  }

  private set_tc_track_by_storm_name_year(stormNameYear: string): void {
    const [name, year] = stormNameYear.split('-')
    const tcTrack = this.tcTrackService.get_tc_tracks_by_name_year(name, year)
    tcTrack.subscribe((tcTracks: TcTrack[]) => {
      const track = tcTracks[0]
      const startDate = track.startDate
      const endDate = track.endDate
      this.tcQueryService.send_tc_start_date(moment.utc(startDate), false)
      this.tcQueryService.send_tc_end_date(moment.utc(endDate), false)
      this.tcQueryService.set_selection_date_range() //set profile query dates to hurricane
      this.tcQueryService.set_url()
      this.tcQueryService.stormNameUpdate.emit('set_tc_track_by_storm_name_year dates set')
      this.zoom_to_storm(track)
      // this.tcTrackService.add_to_track_layer(track, this.tcMapService.selectedStorm) // add to set times
      this.tcTrackService.add_to_track_layer(track, this.tcMapService.globalTcTracks) // add so that you can draw buffer
    })
  }

  private zoom_to_storm(track: TcTrack): void {
    let latMin = 999
    let latMax = -999
    let lonMin = 999
    let lonMax = -999

    track.traj_data.forEach( (point: TrajData) => {
      latMin = Math.min(point.lat, latMin)
      lonMin = Math.min(point.lon, lonMin)
      latMax = Math.max(point.lat, latMax)
      lonMax = Math.max(point.lon, lonMax)
    })
    const latLonBounds = new L.LatLngBounds([latMin, lonMin], [latMax, lonMax])
    const options = {padding: [65,65]} as L.FitBoundsOptions
    this.map.fitBounds(latLonBounds, options)
  }

  private set_tc_tracks(tcTracks: TcTrack[]) {
    tcTracks.forEach((track: TcTrack) => {
      this.tcTrackService.add_to_track_layer(track, this.tcMapService.globalTcTracks)
    })
  }

  public set_points_on_tc_map(sendNotification=true): void {
    let shapeArrays = this.tcQueryService.get_shapes()
    if (shapeArrays) {
      this.markersLayer.clearLayers()
      const daterange = this.tcQueryService.get_selection_dates()
      const presRange = this.tcQueryService.get_pres_range() as [number, number]

      shapeArrays.forEach( (shape) => {
        const transformedShape = this.tcMapService.get_transformed_shape(shape)
        this.pointsService.get_selection_points(daterange, transformedShape, presRange)
            .subscribe((selectionPoints: ProfilePoints[]) => {
              this.display_profiles(selectionPoints, 'normalMarker')
              if (selectionPoints.length == 0 && sendNotification) {
                this.notifier.notify( 'warning', 'no profile points found in shape' )
                console.log('no points returned in shape')
              }
              }, 
            error => {
              if (sendNotification) {this.notifier.notify( 'error', 'error in getting profiles in shape' )}
              console.log('error occured when selecting points: ', error.message)
            })      
        })
    }
  }


  public display_profiles(profilePoints: ProfilePoints[], markerType: string): void {

    const includeRT = this.tcQueryService.get_realtime_toggle()
    const bgcOnly = this.tcQueryService.get_bgc_toggle()
    const deepOnly = this.tcQueryService.get_deep_toggle()

    for (let idx in profilePoints) {
      let profile = profilePoints[idx]
      let dataMode = profile.DATA_MODE
      if ( ( dataMode == 'R' || dataMode == 'A' ) && (includeRT == false) ) { continue }
      if ( !profile.containsBGC===true && bgcOnly) { continue } //be careful, old values may equal 1. use ==
      if ( !profile.isDeep===true && deepOnly ) { continue } // always use ===
      if (markerType==='history') {
        this.markersLayer = this.pointsService.add_to_markers_layer(profile, this.markersLayer, this.pointsService.argoIconBW, this.wrapCoordinates)
      }
      else if (markerType==='platform') {
        this.markersLayer = this.pointsService.add_to_markers_layer(profile, this.markersLayer, this.pointsService.platformIcon, this.wrapCoordinates)
      }
      else if (profile.containsBGC) {
        this.markersLayer = this.pointsService.add_to_markers_layer(profile, this.markersLayer, this.pointsService.argoIconBGC, this.wrapCoordinates)
      }
      else if (profile.isDeep) {
        this.markersLayer = this.pointsService.add_to_markers_layer(profile, this.markersLayer, this.pointsService.argoIconDeep, this.wrapCoordinates)
      }
      else {
        this.markersLayer = this.pointsService.add_to_markers_layer(profile, this.markersLayer, this.pointsService.argoIcon, this.wrapCoordinates)
      }
    }
    }

}
