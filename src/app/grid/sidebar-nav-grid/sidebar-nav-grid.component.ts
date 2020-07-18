import { Component, OnInit } from '@angular/core';
import { QueryGridService } from '../query-grid.service'
import * as moment from 'moment'
import { SelectGridService } from '../select-grid.service'
import { GridMeta } from './../../../typeings/grids'

@Component({
  selector: 'app-sidebar-nav-grid',
  templateUrl: './sidebar-nav-grid.component.html',
  styleUrls: ['./sidebar-nav-grid.component.css'],
})
export class SidebarNavGridComponent implements OnInit {

  constructor(private queryGridService: QueryGridService, private selectGridService: SelectGridService) { }
  public interpolateBool: boolean
  public paramMode: boolean
  public monthPicker: boolean
  public initSet: boolean = false

  ngOnInit() {
    this.paramMode = this.queryGridService.getParamMode()
    this.interpolateBool = this.queryGridService.getInterplateBool()

    this.queryGridService.urlBuild.subscribe(msg => {
      this.interpolateBool = this.queryGridService.getInterplateBool()
      this.paramMode = this.queryGridService.getParamMode();
      if (!this.initSet) { // initialize gridMeta
        this.getGridMeta()
      }
      this.initSet = true
    })
    
    this.queryGridService.change.subscribe(msg => {
      this.paramMode = this.queryGridService.getParamMode();
      const gridName = this.queryGridService.getGridName()
      gridName === 'sose_si_area_3_day'? this.monthPicker = false: this.monthPicker = true

      //set date to start of month if using month picker.
      if (this.monthPicker) { this.queryGridService.sendDate(this.queryGridService.getDate().startOf('month'), false)}
      if (msg === 'grid change') {
        console.log('getting grid meta')
        this.getGridMeta()
      }
    })
  }

  public getGridMeta(): void {
    const gridName = this.queryGridService.getGridName()
    gridName === 'sose_si_area_3_day'? this.monthPicker = false: this.monthPicker = true
    console.log('gridName', gridName, 'monthPicker?', this.monthPicker)

    this.selectGridService.getGridMeta(gridName).subscribe( (gridMetas: GridMeta[] )=> {
      this.selectGridService.gridMetaChange.emit(gridMetas[0])
    })
  }

  public clearGrids(): void {
    this.queryGridService.triggerClearLayers();
  }

  public resetToStart(): void {
    this.queryGridService.triggerResetToStart();
  }

  public interpolateBoolToggle(checked: boolean): void {
    this.interpolateBool = checked
    const broadcastChange = true
    this.queryGridService.sendInterpolateBool(this.interpolateBool, broadcastChange);
  }

  public paramModeToggle(checked: boolean): void {
    this.paramMode = checked
    if (this.paramMode) {
      const broadcastChange = false
      const param = 'anomaly'
      this.queryGridService.sendParam(param, broadcastChange)
    }
    this.queryGridService.sendParamMode(this.paramMode);
  }

}
