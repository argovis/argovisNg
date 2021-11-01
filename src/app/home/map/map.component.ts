import { Component, OnInit, OnDestroy, ApplicationRef, Injector } from '@angular/core'
import { MapService } from '../services/map.service'
import { PointsService } from '../services/points.service'
import { ProfilePoints } from '../../models/profile-points'
import { QueryService } from '../services/query.service'
import * as L from "leaflet"
import { NotifierService } from 'angular-notifier'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})

export class MapComponent implements OnInit, OnDestroy {
  public map: L.Map
  public markersLayer = L.layerGroup()
  public startView: L.LatLng
  public startZoom: number
  public graticule: any
  public wrapCoordinates: boolean
  public proj: string
  public readonly notifier: NotifierService
  public appRef: ApplicationRef
  public mapService: MapService
  public pointsService: PointsService
  public queryService: QueryService
  public notifierService: NotifierService
  constructor(public injector: Injector) {  this.notifierService = injector.get(NotifierService)
                                            this.notifier = this.notifierService
                                            this.appRef = this.injector.get(ApplicationRef)
                                            this.mapService = injector.get(MapService)
                                            this.pointsService = injector.get(PointsService)
                                            this.queryService = injector.get(QueryService)
                                            }

  ngOnInit() {
    this.pointsService.init(this.appRef)
    this.mapService.init(this.appRef)

    this.set_params_and_events()


    this.invalidate_size()
    //sets starting profiles from URL. Default is no params
    setTimeout(() => {  // RTimeout required to prevent expressionchangedafterithasbeencheckederror.
      this.addShapesFromQueryService()
     })
  }

  ngOnDestroy() {
    this.map.off()
    this.map.remove()
  }

  public set_map(): void {
    this.map = this.mapService.generate_map(this.proj)
    this.startView = this.map.getCenter()
    this.startZoom = this.map.getZoom()

    this.mapService.coordDisplay.addTo(this.map)
    this.mapService.drawnItems.addTo(this.map)
    this.mapService.scaleDisplay.addTo(this.map)
    this.mapService.drawControl.addTo(this.map)
    this.markersLayer.addTo(this.map)   

    this.map.on('draw:edited', (event: L.DrawEvents.Edited) => {
      this.markersLayer.clearLayers()
      const broadcast = true
      const toggleThreeDayOff = false
      const drawnItems = this.mapService.drawnItems.toGeoJSON().features
      const shapes = this.queryService.get_shapes_from_features(drawnItems)
      this.queryService.send_shape(shapes, broadcast, toggleThreeDayOff)
    })

    this.map.on('draw:created', (event: L.DrawEvents.Created) => {
      this.markersLayer.clearLayers()
      const layer = event.layer as L.Polygon<any>
      this.mapService.popup_window_creation(layer, this.mapService.drawnItems)
      const broadcast = true
      const toggleThreeDayOff = true

      const drawnItems = this.mapService.drawnItems.toGeoJSON().features
      const shapes = this.queryService.get_shapes_from_features(drawnItems)
      this.queryService.send_shape(shapes, broadcast, toggleThreeDayOff)
    })

    this.map.on('draw:deleted', (event: L.DrawEvents.Deleted) => {
      const layers = event.layers
      let myNewShape = this.mapService.drawnItems
      layers.eachLayer(function(layer: any) {
        const layer_id = layer._leaflet_id
        myNewShape.removeLayer(layer)
      })
      this.mapService.drawnItems = myNewShape
      const broadcast = true
      const toggleThreeDayOff = false

      const drawnItems = this.mapService.drawnItems.toGeoJSON().features
      const shape = this.queryService.get_shapes_from_features(drawnItems)
      this.queryService.send_shape(shape, broadcast, toggleThreeDayOff)
    })
  }

  public set_params_and_events(): void {
    //can be overwritten in child components
    this.queryService.set_params_from_url()
    this.proj = this.queryService.get_proj()
    if ( this.proj === 'WM' ){
      this.wrapCoordinates = true
    }
    this.set_map()
    this.queryService.change
      .subscribe(msg => {
         this.queryService.set_url()
         this.markersLayer.clearLayers()
         this.set_points_on_map()
         const showThreeDay = this.queryService.get_three_day_toggle()
         if (showThreeDay) {
            this.add_display_profiles()
         }
        })

    this.queryService.clear_layers
      .subscribe( () => {
        this.queryService.clear_shapes()
        this.markersLayer.clearLayers()
        this.mapService.drawnItems.clearLayers()
        this.queryService.set_url()
      })
    
    this.queryService.resetToStart
      .subscribe( () => {
        this.queryService.clear_shapes()
        this.markersLayer.clearLayers()
        this.mapService.drawnItems.clearLayers()
        this.set_starting_profiles()
        this.map.setView([this.startView.lat, this.startView.lng], this.startZoom)
      })

    this.queryService.displayPlatform
    .subscribe( platform => {
      this.markersLayer.clearLayers()
      this.mapService.drawnItems.clearLayers()
      this.pointsService.get_platform_profiles(platform)
        .subscribe((profilePoints: ProfilePoints[]) => {
          if (profilePoints.length > 0) {
            this.display_profiles(profilePoints, 'platform')
            this.map.setView([this.startView.lat, this.startView.lng], 2.5)
          }
          else {
            if (platform.length >= 7){
              this.notifier.notify( 'warning', 'platform: '+platform+' not found' )
            }
          }
        },
        error => {
          this.notifier.notify( 'error', 'error in getting platform: '+platform+' profiles.' )
          })
    })

    this.queryService.triggerPlatformDisplay
      .subscribe( platform => {
        this.pointsService.get_platform_profiles(platform)
          .subscribe((profilePoints: ProfilePoints[]) => {
            this.display_profiles(profilePoints, 'history')
          },
          error => { 
            this.notifier.notify( 'error', 'error in getting platform: '+platform+' profiles' )
           })
    })
  }

  private addShapesFromQueryService(): void {
    let shapeArrays = this.queryService.get_shapes()
    if (shapeArrays) {
      const shapeFeatureGroup = this.mapService.convertArrayToFeatureGroup(shapeArrays, this.mapService.shapeOptions)
      shapeFeatureGroup.eachLayer( layer => {
        const polygon = layer as L.Polygon
        this.mapService.popup_window_creation(polygon, this.mapService.drawnItems)
      })
    }
    const broadcast = true // set to true to set page initially
    const toggleThreeDayOff = false

    const drawnItems = this.mapService.drawnItems.toGeoJSON().features
    const shape = this.queryService.get_shapes_from_features(drawnItems)
    this.queryService.send_shape(shape, broadcast, toggleThreeDayOff)
  }

  public set_starting_profiles(this): void {
    if (this.queryService.get_three_day_toggle()) {
      this.pointsService.get_last_three_days_profiles()
      .subscribe((profilePoints: ProfilePoints[]) => {
        if (profilePoints.length == 0) {
          this.notifier.notify( 'warning', 'zero profile points returned' )
        }
        else {
          this.display_profiles(profilePoints, 'normalMarker')
        }
        },
        error => {
          this.notifier.notify( 'error', 'error in getting last three day profiles' )
        })
    }
  }

  public add_display_profiles(): void {
    if (!this.queryService.get_three_day_toggle()) {return}
    const startDate = this.queryService.get_global_display_date()
    this.pointsService.get_last_three_days_profiles(startDate)
    .subscribe((profilePoints: ProfilePoints[]) => {
      if (profilePoints.length == 0) {
        this.notifier.notify( 'warning', 'zero profile points returned' )
      }
      else {
        this.display_profiles(profilePoints, 'normalMarker')
      }
      },
      error => {
        if (error.error.code == 404){
          this.notifier.notify( 'warning', '404 | zero profile points returned' )
        } else {
          this.notifier.notify( 'error', error.error.code + ' | ' + error.error.message )
        }
      })
    }
  
  public setMockPoints(): void {
    this.pointsService.get_mock_points()
    .subscribe((profilePoints: ProfilePoints[]) => {
      if (profilePoints.length == 0) {
        this.notifier.notify( 'warning', 'zero mock profile points returned' )
      }
      else {
        this.display_profiles(profilePoints, 'normalMarker')
      }
      },
      error => {
        this.notifier.notify( 'error', 'error in getting mock profiles' )
      })
  }

  public invalidate_size(): void {
    if (this.map) {
      setTimeout(() => {
        this.map.invalidateSize(true)
      },100)
    }
  }

  public display_profiles(profilePoints, markerType): void {

    const includeRT = this.queryService.get_realtime_toggle()
    const bgcOnly = this.queryService.get_bgc_toggle()
    const deepOnly = this.queryService.get_deep_toggle()

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


  public set_points_on_map(sendNotification=true): void {
    let shapeArrays = this.queryService.get_shapes()
    if (shapeArrays) {
      this.markersLayer.clearLayers()
      const daterange = this.queryService.get_selection_dates()
      const presRange = this.queryService.get_pres_range()

      shapeArrays.forEach( (shape) => {
        const transformedShape = this.mapService.get_transformed_shape(shape)
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
}