import { Injectable, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CovarService {

  constructor(private route: ActivatedRoute,
              private router: Router) {
                this.router.urlUpdateStrategy = 'eager'
              }

  @Output() change: EventEmitter<string> = new EventEmitter
  private proj = 'EPSG:3857';
  private forcastDays = 60;
  private lngLat  = [0, 0];
  private dataUrl: string;

  public readURLParams(): void {
      this.route.queryParams.subscribe(params => {
        Object.keys(params).forEach(key => {
          this.set_map_state(key, params[key])
        });
      });
  }

  public set_url(): void {

    let lngLatString = null
    if (this.lngLat) {
      lngLatString = JSON.stringify(this.lngLat)
    }
    const forcastDaysString=JSON.stringify(this.forcastDays)
    let queryParams = {
                         'forcastDays': forcastDaysString, 
                         'proj': this.proj,
                         'lngLat': lngLatString,
                        }


    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: queryParams,
      });
  }

  public set_map_state(this, key: string, value: string): void {
    const notifyChange = false
    switch(key) {
      case 'forcastDays': {
        const forcastDays = JSON.parse(value)
        this.sendForcast(forcastDays, notifyChange)
        break;
      }
      case 'proj': {
        this.send_proj(value, notifyChange)
        break;
      }
      case 'lngLat': {
        const lngLat = JSON.parse(value)
        this.sendLngLat(lngLat, notifyChange)
        break;
      }
      default: {
        console.log('key not found. not doing anything')
        break;
    }
  }
}
  public getDataUrl(): string {
    return this.dataUrl
  }

  public buildDataUrl(): void {
    const lngLat = this.getLngLat()
    let url = environment.apiRoot + '/covarGrid?'
    url += 'lat=' + JSON.stringify(lngLat[0])
    url += '&lon=' + JSON.stringify(lngLat[1])

    const forcastDays = this.getForcast()
    url += '&forcastDays=' + JSON.stringify(forcastDays)
    this.dataUrl = url
  }

  public get_proj(): string {
    return this.proj
  }

  public send_proj(proj: string, notifyChange=true): void {
    if (proj !== this.proj) {
      this.proj = proj;
    }
    if (notifyChange) {
      this.change.emit('proj changed');
    }
  }

  public getForcast(): number {
    return this.forcastDays;
  }

  public sendForcast(forcastDays: number, notifyChange=true): void {
    if (forcastDays !== this.forcastDays) {
      this.forcastDays = forcastDays;
    }
    if (notifyChange) {
      this.change.emit('long Covar Changed');
    }
  }

  public getLngLat(): number[] {
    return this.lngLat
  }

  public sendLngLat(lngLat: number[], notifyChange=true): void {
    if (lngLat !== this.lngLat) {
      this.lngLat = lngLat;
    }
    if (notifyChange) {
      this.change.emit('lngLat changed');
    }
  }

}
