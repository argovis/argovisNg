import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfviewComponent } from './profview.component';
import { TableComponent } from './table/table.component';
import { MaterialModule } from '../material/material.module';

import * as PlotlyJS from 'plotly.js/dist/plotly.js';
import { PlotlyModule } from 'angular-plotly.js';
import { PlatformWindowComponent } from './platform-window/platform-window.component';
import { GlobeScatterComponent } from './globe-scatter/globe-scatter.component';
import { VarplotComponent } from './varplot/varplot.component';

PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [ProfviewComponent, TableComponent, PlatformWindowComponent, GlobeScatterComponent, VarplotComponent],
  imports: [
    CommonModule,
    MaterialModule,
    PlotlyModule,
    ReactiveFormsModule
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
})
export class ProfviewModule { }
