import { Component, OnInit, Injector } from '@angular/core'
import { MapComponent } from './../../home/map/map.component'
import { ArQueryService } from './../ar-query.service'
import { ArMapService } from './../ar-map.service'
import { ArShapeService } from './../ar-shape.service'
import { ARShape } from '../../models/ar-shape'
import { ProfilePoints } from '../../models/profile-points'
import * as L from "leaflet"
@Component({
  selector: 'app-ar-map',
  templateUrl: './ar-map.component.html',
  styleUrls: ['./ar-map.component.css']
})
export class ArMapComponent extends MapComponent implements OnInit {
  private arQueryService: ArQueryService
  private arMapService: ArMapService
  private arShapeService: ArShapeService
  constructor(public injector: Injector) { super(injector)
                                           this.arQueryService = this.injector.get(ArQueryService)
                                           this.arMapService = this.injector.get(ArMapService)
                                           this.arShapeService = this.injector.get(ArShapeService)
                                         }

  ngOnInit() {
    this.pointsService.init(this.appRef)
    this.arMapService.init(this.appRef)
    this.set_params_and_events()
    this.proj = 'WM'
    this.wrapCoordinates = true
    this.set_points_on_map()

    this.invalidate_size()
  }

  public set_map(): void {
    this.map = this.arMapService.generate_map(this.proj)
    this.startView = this.map.getCenter()
    this.startZoom = this.map.getZoom()

    this.arMapService.coordDisplay.addTo(this.map)
    this.arMapService.arShapeItems.addTo(this.map) //special shapes for ar objects
    this.arMapService.scaleDisplay.addTo(this.map)
    this.markersLayer.addTo(this.map)   
  }

  public set_params_and_events(): void { //  rewritten function is called in super.ngOnInit()
    this.set_map()
    console.log('setting params from ar map component')
    this.arQueryService.set_params_from_url()

    this.arQueryService.change
      .subscribe(msg => {
        this.arQueryService.set_url()
        this.markersLayer.clearLayers()
        this.set_points_on_map()
        })
    this.arQueryService.clear_layers
      .subscribe( () => {
        this.arQueryService.clear_shapes()
        this.markersLayer.clearLayers()
        this.arMapService.arShapeItems.clearLayers()
        this.arQueryService.set_url()
      })
    this.arQueryService.resetToStart
      .subscribe( () => {
        this.arQueryService.clear_shapes()
        this.markersLayer.clearLayers()
        // this.arMapService.drawnItems.clear_layers()
        this.arMapService.arShapeItems.clearLayers()
        this.map.setView([this.startView.lat, this.startView.lng], this.startZoom)
      })
    this.arQueryService.arEvent
    .subscribe( (msg: string) => {
      console.log('arEvent emitted')
      const dateString = this.arQueryService.format_date(this.arQueryService.get_ar_date())
      const arShapes = this.arShapeService.get_ar_shapes(dateString)
      arShapes.subscribe((arShapes: ARShape[]) => {
        if (arShapes.length !== 0) {
          this.arQueryService.set_selection_date_range() // for profiles
          this.set_ar_shape(arShapes)
        }
        else {
            this.notifier.notify( 'warning', 'no ar shapes found for date selected' )
        }
      })
    })
  }
  
  private convert_ar_to_shape_array_and_id(arShapes: ARShape[]) {
    let shapeArrays = []
    let shape_ids = []
    for(let idx=0; idx<arShapes.length; idx++){
      let sa = arShapes[idx].geoLocation.coordinates
      sa = sa.map(coord => ([coord[1], coord[0]]))
      const shape_id = arShapes[idx]._id
      shape_ids.push(shape_id)
      shapeArrays.push(sa)
    }
    return [shapeArrays, shape_ids]
  }

  private set_ar_shape(arShapes: ARShape[]) {
    const [shapeArrays, shape_ids] = this.convert_ar_to_shape_array_and_id(arShapes)
    const shapeFeatureGroup = this.arMapService.convertArrayToFeatureGroup(shapeArrays, this.arMapService.arShapeOptions)
    const shapeType = 'atmospheric river shape'

    let shapes = []
    let idx = 0
    shapeFeatureGroup.eachLayer( (layer: unknown) => {
      const polygon = layer as L.Polygon
      shapes.push([shape_ids[idx], polygon])
      idx += 1
    })
    for(let idx=0; idx<shapes.length; idx++){
      const shape_id = shapes[idx][0]
      const polygon = shapes[idx][1] as L.Polygon
      this.arMapService.ar_popup_window_creation(polygon, this.arMapService.arShapeItems, shapeType, shape_id)
    }
    this.arQueryService.send_ar_shapes(shapeArrays)
  }

  
  public set_points_on_map(sendNotification=true): void {
    let shapeArrays = this.arQueryService.get_shapes()
    const displayGlobally = this.arQueryService.get_display_globally()
    if (shapeArrays && !displayGlobally) {
      this.set_shape_profiles(shapeArrays, sendNotification)
    }
    if (displayGlobally) {
      this.sed_global_profiles()
    }
  }

  private set_shape_profiles(shapeArrays: number[][][], sendNotification=true): void { 
    this.markersLayer.clearLayers()
    const daterange = this.arQueryService.get_ar_date_as_date_range()

    shapeArrays.forEach( (shape) => {
      const transformedShape = this.arMapService.get_transformed_shape(shape)
      this.pointsService.get_selection_points(daterange, transformedShape)
          .subscribe((selectionPoints: ProfilePoints[]) => {
            if (selectionPoints.length == 0 && !this.arQueryService.get_display_globally()) {
              this.notifier.notify( 'info', 'no profile points found inside a shape' )
            }
            else {
              this.display_profiles(selectionPoints, 'normalMarker')
            }
            }, 
          error => {
            if (sendNotification) {this.notifier.notify( 'error', 'error in getting profiles in shape' )}
            console.log('error occured when selecting points: ', error.message)
          })      
      })

}

  private sed_global_profiles(): void {

    const dateRange = this.arQueryService.get_ar_date_as_date_range()
    this.pointsService.get_global_map_profiles(dateRange.startDate, dateRange.endDate)
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

  public display_profiles(profilePoints: ProfilePoints[], markerType: string): void {

    const includeRT = this.arQueryService.get_realtime_toggle()
    const bgcOnly = this.arQueryService.get_bgc_toggle()
    const deepOnly = this.arQueryService.get_deep_toggle()

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
