import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../material/material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import "leaflet";
import "leaflet-draw";
import { NouisliderModule } from 'ng2-nouislider';

import { GridComponent } from './grid.component';
import { MapGridComponent } from './map-grid/map-grid.component';
import { SidebarNavGridComponent } from './sidebar-nav-grid/sidebar-nav-grid.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MonthPickerComponent } from './sidebar-nav-grid/month-picker/month-picker.component';
import { PresSelComponent } from './sidebar-nav-grid/pres-sel/pres-sel.component';
import { QueryGridService } from './query-grid.service';
import { GridPickerComponent } from './sidebar-nav-grid/grid-picker/grid-picker.component';
import { GridComparePickerComponent } from './sidebar-nav-grid/grid-compare-picker/grid-compare-picker.component';
import { GridColorPickerComponent } from './sidebar-nav-grid/grid-color-picker/grid-color-picker.component';
import { ColorbarComponent } from './sidebar-nav-grid/colorbar/colorbar.component';
import { DatePickerComponent } from './sidebar-nav-grid/date-picker/date-picker.component';
import { MonthSubtrahendPickerComponent } from './sidebar-nav-grid/month-subtrahend-picker/month-subtrahend-picker.component';
import { GridSubtrahendPickerComponent } from './sidebar-nav-grid/grid-subtrahend-picker/grid-subtrahend-picker.component';

@NgModule({
  declarations: [
    GridComponent,
    MapGridComponent,
    SidebarNavGridComponent,
    MonthPickerComponent,
    PresSelComponent,
    GridPickerComponent,
    GridComparePickerComponent,
    GridColorPickerComponent,
    ColorbarComponent,
    DatePickerComponent,
    MonthSubtrahendPickerComponent,
    GridSubtrahendPickerComponent
    ],
  providers: [
    QueryGridService,
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  imports: [
    MaterialModule,
    NouisliderModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule,
  ],
})
export class GridModule { }
