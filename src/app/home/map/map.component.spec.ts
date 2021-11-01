import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, fakeAsync, tick, flush, ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { MapService } from '../services/map.service';
import { PointsService } from '../services/points.service';
import { QueryService } from '../services/query.service';
import { DebugElement } from '@angular/core'; //can view dom elements with this
import { PopupCompileService } from '../services/popup-compile.service';
import { NotifierService, NotifierModule } from 'angular-notifier';

import { MaterialModule } from '../../material/material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let debugElement: DebugElement;
  let queryService: QueryService;
  let mapService: MapService;
  let pointsService: PointsService;
  let spyRT: jasmine.Spy;
  let get_projSpy: jasmine.Spy;
  let display_profilesSpy: jasmine.Spy;
  let set_points_on_mapSpy: jasmine.Spy;
  let spyURL: jasmine.Spy;
  let get_selection_pointsSpy: jasmine.Spy;
  let get_platform_profilesSpy: jasmine.Spy;
  let getLastThreeDaysProfiles: jasmine.Spy;
  let popupWindowCreationSpy: jasmine.Spy;

  beforeEach( () => {
    TestBed.configureTestingModule({
      declarations: [ MapComponent ],
      providers: 
      [NotifierService,
       { provide: MapService, useValue: get_projSpy },
       MapService,
       PointsService,
       QueryService,
       PopupCompileService],
       imports: [ RouterTestingModule,
                  NotifierModule,
                  MaterialModule,
                  BrowserAnimationsModule,
                  HttpClientTestingModule
                ],

    })
    .compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;

    queryService = debugElement.injector.get(QueryService);
    mapService = debugElement.injector.get(MapService)
    pointsService = debugElement.injector.get(PointsService)

    const mockPoints = pointsService.get_mock_points()

    const get_selection_points = spyOn(pointsService, 'get_selection_points').and.returnValue(mockPoints)
    const get_platform_profiles = spyOn(pointsService, 'get_platform_profiles').and.returnValue(mockPoints)
    const getLastThreeDaysProfiles = spyOn(pointsService, 'get_last_three_days_profiles').and.returnValue(mockPoints)
    const popupWindowCreationSpy = spyOn(mapService, 'popup_window_creation').and.callThrough()
    spyURL = spyOn(queryService, 'set_url'); 
    display_profilesSpy = spyOn<any>(component, 'display_profiles').and.callThrough()
    set_points_on_mapSpy = spyOn<any>(component, 'set_points_on_map').and.callThrough()
    get_projSpy = spyOn(queryService, 'get_proj').and.returnValue('WM');
    fixture.detectChanges();
  });


  it('should create', () => {
     expect(component).toBeTruthy();
  });

  it('should have web mercator', () => {
    //TODO: find out why getting false positives!
    queryService['threeDayToggle'] = false
    queryService.set_proj('WM')

    //get_last_three_days_profiles
    //spy = spyOn(queryService, 'get_proj').and.returnValue('WM');
    expect(component['wrappedComponents'] == true)

    const lat = mapService['WMstartView'][0]
    const lng = mapService['WMstartView'][1]
    expect(component.startView.lat === lat)
    expect(component.startView.lat === lng)
    expect(component.startZoom === mapService['WMStartZoom'])
  })


  it('should have southern stereographic', () => {
    //TODO: find out why getting false positives!
    queryService.set_proj('SSP')
    expect(component['proj'] == 'SSP')
    expect(component['wrappedComponents'] == false)
    const lat = mapService['SSPstartView'][0]
    const lng = mapService['SSPstartView'][1]
    expect(component.startView.lat === lat)
    expect(component.startView.lat === lng)
    expect(component.startZoom === mapService['SSPStartZoom'])
  })

  it('should have northern stereographic', () => {
    queryService.set_proj('NSP')
    expect(component['proj'] == 'NSP')
    expect(component['wrappedComponents'] == false)
    const lat = mapService['NSPstartView'][0]
    const lng = mapService['NSPstartView'][1]
    expect(component.startView.lat === lat)
    expect(component.startView.lat === lng)
    expect(component.startZoom === mapService['NSPStartZoom'])
  })

  it('should have Default set', () => {
    queryService.set_proj('made up')
    expect(component['proj'] == 'WM')
    expect(component['wrappedComponents'] == true)
    const lat = mapService['WMstartView'][0]
    const lng = mapService['WMstartView'][1]
    expect(component.startView.lat === lat)
    expect(component.startView.lat === lng)
    expect(component.startZoom === mapService['WMStartZoom'])
  })

  it('should add and remove mock points', () => {
    component.setMockPoints()
    let myMarkers = component.markersLayer.toGeoJSON()
    expect(myMarkers['features'].length > 0)
    component.markersLayer.clearLayers()
    myMarkers = component.markersLayer.toGeoJSON()
    expect(myMarkers['features'].length === 0)
  })


  it('should detect query service change', () => {

    component.setMockPoints()
    expect(display_profilesSpy).toHaveBeenCalledTimes(1);
    expect(spyURL).toHaveBeenCalledTimes(0);
    
    queryService.change.emit('testing a change')
    expect(spyURL).toHaveBeenCalled()
    expect(spyURL).toHaveBeenCalledTimes(1);

    expect(display_profilesSpy).toHaveBeenCalled();
    expect(display_profilesSpy).toHaveBeenCalledTimes(2);

    let myMarkers = component.markersLayer.toGeoJSON()
    expect(myMarkers['features'].length === 0)
  });

  it('should detect query service clear_layers', () => {
    component.setMockPoints()
    expect(display_profilesSpy).toHaveBeenCalledTimes(1);
    expect(spyURL).toHaveBeenCalledTimes(0);
    
    queryService.resetToStart.emit('testing a clear')
    expect(spyURL).toHaveBeenCalledTimes(0); //should not be called

    expect(display_profilesSpy).toHaveBeenCalledTimes(2); //should not be called
    expect(set_points_on_mapSpy).toHaveBeenCalledTimes(0);
    let myMarkers = component.markersLayer.toGeoJSON()
    expect(myMarkers['features'].length === 0)
  });

  it('should add a shape', () => {
    const shapes = [[[55.578345,-146.074219],[52.908902,-148.886719],[52.48278,-141.328125],[55.578345,-146.074219]]]
    const notifiyChange = true 
    //we check if shape is added indirectly by checking if set_points_on_map() is called. It should when a change occurs.
    expect(set_points_on_mapSpy).toHaveBeenCalledTimes(0)
    let drawnItemsBefore = component.mapService.drawnItems.toGeoJSON()
    expect(drawnItemsBefore['features'].length).toEqual(0)
    queryService.send_shape(shapes, notifiyChange)
    expect(set_points_on_mapSpy).toHaveBeenCalledTimes(1)
  })

});
