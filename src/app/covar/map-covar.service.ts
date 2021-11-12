import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { CovarPoints } from '../models/covar-points'

import { Observable, of } from 'rxjs';
import { Style, Fill, Stroke, Icon } from 'ol/style.js'
import VectorLayer from 'ol/layer/Vector.js';
import { fromLonLat } from 'ol/proj.js';
import { Polygon, Point } from 'ol/geom.js'
import GeoJSON from 'ol/format/GeoJSON.js';
import Feature from 'ol/Feature.js';
import { Vector as VectorSource } from 'ol/source.js'
import { environment } from '../../environments/environment';

import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})
export class MapCovarService {

  constructor(private http: HttpClient) { }


  private mockCovarPoints: CovarPoints = {
    _id : "78.0_-16.0",
    dLat: 2,
    dLong: 2,
    geoLocation : {
      type : "Point",
      coordinates : [
        78,
        -16
      ]
    },
    features : [
      {
        geometry : {
          type : "Point",
          coordinates : [
            72,
            -12
          ]
        },
        type : "Feature",
        properties : {
          "Probability" : 0.023255813953488372
        }
      },
      {
        geometry : {
          type : "Point",
          coordinates : [
            82,
            -14
          ]
        },
        type : "Feature",
        properties : {
          "Probability" : 0.023255813953488372
        }
      },
      {
        geometry : {
          type : "Point",
          coordinates : [
            74,
            -16
          ]
        },
        type : "Feature",
        properties : {
          "Probability" : 0.023255813953488372
        }
      },
      {
        geometry : {
          type : "Point",
          coordinates : [
            76,
            -16
          ]
        },
        type : "Feature",
        properties : {
          "Probability" : 0.13953488372093023
        }
      },
      {
        geometry : {
          type : "Point",
          coordinates : [
            76,
            -18
          ]
        },
        type : "Feature",
        properties : {
          "Probability" : 0.09302325581395349
        }
      },
      {
        geometry : {
          type : "Point",
          coordinates : [
            78,
            -18
          ]
        },
        type : "Feature",
        properties : {
          "Probability" : 0.16279069767441862
        }
      },
      {
        geometry : {
          type : "Point",
          coordinates : [
            80,
            -14
          ]
        },
        type : "Feature",
        properties : {
          "Probability" : 0.046511627906976744
        }
      },
      {
        geometry : {
          type : "Point",
          coordinates : [
            76,
            -14
          ]
        },
        type : "Feature",
        properties : {
          "Probability" : 0.06976744186046512
        }
      },
      {
        geometry : {
          type : "Point",
          coordinates : [
            74,
            -14
          ]
        },
        type : "Feature",
        properties : {
          "Probability" : 0.023255813953488372
        }
      },
      {
        geometry : {
          type : "Point",
          coordinates : [
            78,
            -16
          ]
        },
        type : "Feature",
        properties : {
          "Probability" : 0.20930232558139536
        }
      },
      {
        geometry : {
          type : "Point",
          coordinates : [
            80,
            -16
          ]
        },
        type : "Feature",
        properties : {
          "Probability" : 0.18604651162790697
        }
      }
    ]
  }

  public getMockCovarPoints(): Observable<CovarPoints> {
    return of(this.mockCovarPoints)
  }

  public getCovarPoints(url: string): Observable<CovarPoints> {
    return this.http.get<CovarPoints>(url, {'headers': environment.apiHeaders})
  }

  public makeCovarPolygons(features: any, proj: string, dLat: number, dLong: number): VectorLayer {
    let maxProb = 0
    features.forEach( (feature: any) => {
      // find max probability for colorscale
      maxProb = Math.max(maxProb, feature.properties.Probability)
      //get polygon coordinates
      const x = feature.geometry.coordinates[0]
      const y = feature.geometry.coordinates[1]
      const shape = { 
        ulc: [x - dLong/2, y + dLat/2],
        urc: [x + dLong/2, y + dLat/2],
        lrc: [x + dLong/2, y - dLat/2],
        llc: [x - dLong/2, y - dLat/2],
      }
      feature.properties.shape = shape
    })
    const colorScale = d3.scaleLinear<string>().domain([0, maxProb]).range(["white", "red"]);

    // make VectorSource of feature collection
    let geoJSONFeatureObject = {'type': 'FeatureCollection', 'features': features}

    geoJSONFeatureObject.features.push()

    const grid = new VectorSource({
      features: (new GeoJSON()).readFeatures(geoJSONFeatureObject,
         {dataProjection: 'EPSG:4326',
          featureProjection: proj}
        ),
      attributions: []
    });

    // Create grid style function
    const gridStyle = function (feature) {
      const prob = feature.getProperties().Probability
      const rgb = d3.rgb(colorScale(prob));

      const shapes = Object.values(feature.getProperties().shape);
      let transShape = []
      shapes.forEach( (coord: number[]) => {
        transShape.push(fromLonLat(coord, proj))
      })

      const covarStyle = new Style({
                                stroke: new Stroke({
                                  color: '#333',
                                  width: 3 
                                  }),
                                  fill: new Fill({
                                      color: [rgb.r, rgb.g, rgb.b, 0.6]
                                  }),
                                  geometry: new Polygon([transShape])
                              })
      return [ covarStyle ];
    };

    let gridLayer = new VectorLayer({
      source: grid,
      style: gridStyle
    });

    gridLayer.set('name', 'grid')

    return(gridLayer)
  }

  public makeFloatPoint(coordinates: number[], proj: string): VectorLayer {

    const marker = new Feature({
      geometry: new Point(
        fromLonLat(coordinates, proj)
      ),
    });
    const vectorSource = new VectorSource({
      features: [marker],
    });

    const pointStyle = new Style({
        image: new Icon({
          scale: .25,
          src: 'assets/img/float-icon.png'
        })
      })

    const floatLayer = new VectorLayer({
      source: vectorSource,
      style: pointStyle
    });

    floatLayer.set('name', 'float')
    return(floatLayer)
  }
}
