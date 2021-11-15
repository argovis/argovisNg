import { Injectable } from '@angular/core';
import { Profile, BgcProfileData, ProfileMeta, PlatformMeta } from './profiles'
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router'
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GetProfilesService {

  constructor(private http: HttpClient) { }
  
  private mockProfiles: Profile[] = [
    {_id:"5906040_114mock!",POSITIONING_SYSTEM:"GPS",PI_NAME:"STEPHEN RISER/KEN JOHNSON",WMO_INST_TYPE:"846",
    VERTICAL_SAMPLING_SCHEME:"Primary sampling: mixed [deep: discrete, shallow:continuous]",
    DATA_MODE:"A",PLATFORM_TYPE:"APEX",station_parameters:["pres","psal","temp"],date: new Date("2020-03-14T13:01:11.000Z"),date_qc:1,lat:24.416,lon:-154.129,
    geoLocation:{type:"Point",coordinates:[-154.129,24.416]},position_qc:1,cycle_number:114,dac:"aoml",platform_number:5906040,
    nc_url:"ftp://ftp.ifremer.fr/ifremer/argo/dac/aoml/5906040/profiles/MR5906040_114.nc",
    measurements:[
      {pres:4.44,psal:34.853,temp:22.659},
      {pres:5.84,psal:34.854,temp:22.655},
      {pres:19.94,psal:34.976,temp:22.533}
    ],
    count:3,core_data_mode:"A",roundLat:"24.416",roundLon:"-154.129",strLat:"24.416 N",strLon:"154.129 W",formatted_station_parameters:[" pres"," psal"," temp"]},
    {_id:"5906040_115mockMock!",POSITIONING_SYSTEM:"GPS",PI_NAME:"STEPHEN RISER/KEN JOHNSON",WMO_INST_TYPE:"846",
    VERTICAL_SAMPLING_SCHEME:"Primary sampling: mixed [deep: discrete, shallow:continuous]",
    DATA_MODE:"A",PLATFORM_TYPE:"APEX",station_parameters:["pres","psal","temp"],date: new Date("2020-03-14T13:01:11.000Z"),date_qc:1,lat:25.416,lon:-155.129,
    geoLocation:{type:"Point",coordinates:[-154.129,24.416]},position_qc:1,cycle_number:114,dac:"aoml",platform_number:5906040,
    nc_url:"ftp://ftp.ifremer.fr/ifremer/argo/dac/aoml/5906040/profiles/MR5906040_114.nc",
    measurements:[
      {pres:5.44,psal:35.853,temp:24.659},
      {pres:6.84,psal:35.854,temp:24.655},
      {pres:20.94,psal:35.976,temp:24.533}
    ],
      count:3,core_data_mode:"A",roundLat:"24.416",roundLon:"-154.129",strLat:"25.416 N",strLon:"155.129 W",formatted_station_parameters:[" pres"," psal"," temp"]},
  ]

  public getMockProfiles(): Observable<Profile[]> {
    return of(this.mockProfiles)
  }

  public getProfiles(url: string): Observable<Profile[]> {
    return this.http.get<Profile[]>(url, {'headers': environment.apiHeaders})
  }

  public get_platform_data(platform: string, meas: string[]): Observable<BgcProfileData[]> {
    let drops = ['time', 'latitude', 'longitude', 'profileID'] // remove these from BGC measurements to request, if present
    meas = meas.filter( ( el ) => !drops.includes( el ) );
    if(meas.length == 0) meas = ['pres'] // need to get at least one variable so we know number of levels
    let url = environment.apiRoot + '/profiles?platforms=' + platform + '&bgcMeasurements=' + meas.join(',')
    return this.http.get<BgcProfileData[]>(url, {'headers': environment.apiHeaders})
  }

  public getPlaformProfileMetaData(platform: string): Observable<ProfileMeta[]> {
    let url = environment.apiRoot + '/profiles?platforms=' + platform
    return this.http.get<ProfileMeta[]>(url, {'headers': environment.apiHeaders})
  }

  public getPlaformMetaData(platform: string): Observable<PlatformMeta[]> {
    let url = environment.apiRoot + '/platforms?platform=' + platform
    return this.http.get<PlatformMeta[]>(url, {'headers': environment.apiHeaders})
  }


}
