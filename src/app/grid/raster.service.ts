import { GridService } from './grid.service';
import { HEX_COLOR_MAPS } from './../profview/colormap.parameters';
import { Injectable, Injector } from '@angular/core';
import { RasterGrid, RasterParam, Grid, GridCoords } from '../models/raster-grid'
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { WasmService } from './wasm.service'
import { mockRaster, mockParamRaster, mockGrid } from './grid.items'
import { environment } from '../../environments/environment';
import * as L from "leaflet";
//leaflet.canvaslayer.field.js depends on d3 and chroma scripts set in angular.json.

import * as d3 from 'd3'; //needed for leaflet canvas layer
// import './../../ext-js/leaflet.canvaslayer.field.js'
import './../../../node_modules/leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js'
//import '../../../node_modules/leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js'
import * as chroma from 'chroma'
import { ChromaStatic, Scale, Color } from 'chroma-js';
declare const chroma: ChromaStatic;

@Injectable({
  providedIn: 'root'
})
export class RasterService extends GridService {

  public mockRaster: RasterGrid[] = mockRaster
  public mockParamRaster: RasterParam[] = mockParamRaster
  public mockGrid: Grid[] = mockGrid
  public http: HttpClient
  public wasmService: WasmService

  constructor( public injector: Injector ) {
    super(injector)
    this.http = injector.get(HttpClient)
    this.wasmService = injector.get(WasmService)
  }


  public getMockGridRaster(): Observable<RasterGrid[]> {
    return of(this.mockRaster)
  }

  public getMockGrid(): Observable<Grid[]> {
    return of(this.mockGrid)
  }

  public getNonUniformGrid( date: string, latRange: number[], lonRange: number[], pres: number,
    gridName: string): Observable<Grid[]> {
    let d = new Date(date)
    let url = environment.apiRoot + '/griddedProducts/nonUniformGrid/window?'
    url += 'latRange=' + latRange[0] + ',' + latRange[1]
    url += '&lonRange=' + lonRange[0] + ',' + lonRange[1]
    url += '&presLevel=' + pres
    url += '&date=' + d.toISOString()
    url += '&gridName=' + gridName
    return this.http.get<Grid[]>(url)
    }

  public getGridCoords( latRange: number[], lonRange: number[], gridName: string): Observable<GridCoords[]> {
    let url = environment.apiRoot + '/griddedProducts/gridCoords?'
    url += 'latRange=' + latRange[0] + ',' + latRange[1]
    url += '&lonRange=' + lonRange[0] + ',' + lonRange[1]
    url += '&gridName=' + gridName
    return this.http.get<GridCoords[]>(url) 
  }

  public getParamRaster(latRange: number[], lonRange: number[], pres: number,
                       gridName: string, gridParam: string): Observable<RasterParam[]> {
    let url = environment.apiRoot + '/griddedProducts/gridParams/window?'
    url += 'latRange=' + latRange[0] + ',' + latRange[1]
    url += '&lonRange=' + lonRange[0] + ',' + lonRange[1]
    url += '&presLevel=' + pres
    url += '&gridName=' + gridName
    url += '&param=' + gridParam
    return this.http.get<RasterParam[]>(url)
  }

  public getTwoParamRaster(latRange: number[], lonRange: number[], pres: number,
                           gridName: string, gridParam: string, gridName2): Observable<[RasterParam[], RasterParam[]]> {
    const numerendGrid = this.getParamRaster(latRange, lonRange, pres, gridName, gridParam)
    const subtrahendGrid = this.getParamRaster(latRange, lonRange, pres, gridName2, gridParam)
    const grids = forkJoin([numerendGrid, subtrahendGrid])
    return grids
  }

  public getGridRaster(latRange: number[], lonRange: number[], date: string,
                       pres: number, gridName: string): Observable<RasterGrid[]> {
    let d = new Date(date)
    let url = environment.apiRoot
    url += '/griddedProducts/grid/window?'
    url += 'latRange=' + latRange[0] + ',' + latRange[1]
    url += '&lonRange=' + lonRange[0] + ',' + lonRange[1]
    url += '&gridName=' + gridName
    url += '&date=' + d.toISOString()
    url += '&presLevel=' + pres
    return this.http.get<RasterGrid[]>(url)
  }

  public getTwoGridRasterProfiles(latRange: number[], lonRange: number[],
                                  date: string, pres: number,
                                  gridName: string, gridName2: string): Observable<[RasterGrid[], RasterGrid[]]> {
      const numerendGrid = this.getGridRaster(latRange, lonRange, date, pres, gridName)
      const subtrahendGrid = this.getGridRaster(latRange, lonRange, date, pres, gridName2)
      const grids = forkJoin([numerendGrid, subtrahendGrid])
      return grids
  }

  public makeDiffGrid(rasterGrids: [RasterGrid[], RasterGrid[]] | [RasterParam[], RasterParam[]]): RasterGrid[] | RasterParam[] {
    const numerendGrid = rasterGrids[0][0]
    const subtrahendGrid = rasterGrids[1][0]
    let dGrid = numerendGrid;
    const gridName = numerendGrid['gridName'] + ' - ' + subtrahendGrid['gridName']
    let zs = []
    console.log('inside makeDiffGrid. adding two numbers using wasm')
    const wasmAdd = this.wasmService.add(100, 200)
    console.log('wasmAdd:', wasmAdd)
    console.log('did you see the answer (300)?')
    for (let idx = 0; idx < numerendGrid['zs'].length; idx++){
      
      const x1 = numerendGrid['zs'][idx]
      const x2 = subtrahendGrid['zs'][idx]
      let c: number;
      if (x1 === numerendGrid['noDataValue'] || x2 === subtrahendGrid['noDataValue']) {
        c = dGrid['noDataValue']
      }
      else{
        c = numerendGrid['zs'][idx] - subtrahendGrid['zs'][idx]
      }
      zs.push(c)
    }
    dGrid['zs'] = zs
    dGrid['gridName'] = gridName

    return [dGrid]
  }

  public makeScalarField(grid: RasterGrid | RasterParam): L.ScalarField {
    for (var i = 0; i < grid.zs.length; i++){
      if (grid.zs[i] == grid.noDataValue) {
          grid.zs[i] = null;
        }
    }
    const s = new L.ScalarField(grid)
    return s
  }

  public get_colorscale(cmapName: string, domain: number[], reverse: boolean): Scale<Color> {
    let c: Scale<Color>
    const hexScale = HEX_COLOR_MAPS[cmapName.toLowerCase()]
    if(reverse) { c = chroma.scale(hexScale).domain(domain.reverse()) }
    else { c = chroma.scale(hexScale).domain(domain) }
    return c
  }

  private makeCanvasLayer(grid: RasterGrid | RasterParam, cmapName: string, inverseColorScale, interpolateBool: boolean, map: L.Map): L.ScalarField { 
    const s = this.makeScalarField(grid)
    let c = this.get_colorscale(cmapName, s.range, inverseColorScale)
    let layer = L.canvasLayer.scalarField(s, {
        color: c,
        interpolate: interpolateBool
    });
    layer['gridName'] = grid['gridName']
    layer['units'] = grid['units']
    layer['measurement'] =  grid['measurement']
    layer['param'] = grid['param']
    
    layer.on('click', function (e) {
      if (e.value !== null) {
          let v = e.value.toFixed(3);
          let html = `<span class="popupText"> ${layer['gridName']} <br /> ${layer['measurement']} <br /> ${layer['param']} <br /> ${v} ${layer['units']}</span>`;
          let popup = L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
      }
      });
      return(layer)
  }

  public addCanvasToGridLayer(grid: RasterGrid | RasterParam, gridLayers: L.LayerGroup,
                              map: L.Map, interpolateBool: boolean, brewerColorScheme='OrRd', inverseColorScale=false): L.LayerGroup {
    let layer = this.makeCanvasLayer(grid, brewerColorScheme, inverseColorScale, interpolateBool, map)
    gridLayers.addLayer(layer)
    return gridLayers
  }

}