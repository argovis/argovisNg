import { Injectable } from '@angular/core';
import { Profile, BgcProfileData, ProfileMeta, PlatformMeta } from './profiles'
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router'

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
    return this.http.get<Profile[]>(url)
  }

  public getTestProfiles(): Observable<Profile[]> {
    const url = 'http://localhost:3001/selection/profiles/?startDate=2020-03-02&endDate=2020-03-16&presRange=[0,10]&shape=[[[168.925781,39.368279],[178.639136,34.666611],[-180,33.814502],[-180,33.814502],[-172.760507,29.28147],[-165.058594,23.402765],[-174.376336,22.951933],[-180,22.348601],[-180,22.348601],[176.404142,21.962821],[167.34375,20.468189],[168.925781,39.368279]]]'
    return this.getProfiles(url)
  }

  public getTestPlaformData(): Observable<BgcProfileData[]> {
    const platform = '5903260'
    const meas_1 = 'pres'
    const meas_2 = 'temp'
    let url = 'catalog/bgc_platform_data/'
    url += platform + '/?'
    url += 'meas_1=' + meas_1 + '&' + 'meas_2=' + meas_2
    return this.http.get<BgcProfileData[]>(url)
  }

  public get_platform_data(platform: string, meas_1: string, meas_2: string): Observable<BgcProfileData[]> {
    let url = 'catalog/bgc_platform_data/'
    url += platform + '/?'
    url += 'meas_1=' + meas_1 + '&' + 'meas_2=' + meas_2
    return this.http.get<BgcProfileData[]>(url)
  }

  public getTestPlaformProfileMetadata(): Observable<ProfileMeta[]> {
    const platform = '5903260'
    return this.getPlaformProfileMetaData(platform)
  }

  public getPlaformProfileMetaData(platform: string): Observable<ProfileMeta[]> {
    let url = 'catalog/platform_profile_metadata/'
    url += platform
    return this.http.get<ProfileMeta[]>(url)
  }

  public getTestPlaformMetaData(): Observable<PlatformMeta[]> {
    const platform = '5903260'
    return this.getPlaformMetaData(platform)
  }

  public getPlaformMetaData(platform: string): Observable<PlatformMeta[]> {
    let url = 'catalog/platform_metadata/'
    url += platform
    return this.http.get<PlatformMeta[]>(url)
  }


}
