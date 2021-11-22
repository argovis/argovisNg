import { Component, OnInit, Input } from '@angular/core';
import { QueryGridService } from '../../query-grid.service';
import { GridParamGroup, GridGroup, EarthProperty, ModelParam, GridMeta } from '../../../../typeings/grids';
import { SelectGridService } from '../../select-grid.service';

@Component({
  selector: 'app-grid-subtrahend-picker',
  templateUrl: './grid-subtrahend-picker.component.html',
  styleUrls: ['./grid-subtrahend-picker.component.css']
})
export class GridSubtrahendPickerComponent implements OnInit {

  constructor(private queryGridService: QueryGridService,
              private selectGridService: SelectGridService) { }

  public gridName: string
  public selectedProperty: string
  public gridParam: string
  public gridParams: ModelParam[]
  public availableGrids: GridGroup[]
  public availableGridParams: GridParamGroup[]
  public availableProperties: EarthProperty[]
  @Input() paramMode: boolean

  ngOnInit() {
    this.availableProperties = this.selectGridService.properties

    this.queryGridService.urlRead.subscribe( (msg: string) => {
      console.log('gridPickerurlbuild msg:', msg)
      if (msg.includes('init')) {
        this.selectedProperty = this.queryGridService.getProperty()
        this.availableGrids = this.selectGridService.getAvailableGrids(this.selectedProperty)
        this.availableGridParams = this.selectGridService.ksParams
        this.gridName = this.queryGridService.getGridName()
        console.log('gridName ', this.gridName,
         '\nselectedProperty', this.selectedProperty,
         '\navailableProperties', this.availableProperties,
         '\navailableGrids', this.availableGrids)
        if (this.paramMode) {
          this.changeGridParams(this.gridName)
          this.gridParam = this.queryGridService.getGridParam()
        }
      }
    })

    this.queryGridService.resetToStart.subscribe(msg => {
      this.gridName = this.queryGridService.getGridName()
      this.changeGridParams(this.gridName)
      this.selectedProperty = this.queryGridService.getProperty()
      this.availableGrids = this.selectGridService.getAvailableGrids(this.selectedProperty)

      this.gridParam = this.queryGridService.getGridParam()
    })

    this.queryGridService.change //updates selection upon change
    .subscribe(msg => {
      const paramMode = this.queryGridService.getParamMode()
      if (msg === 'display grid param change' && paramMode) {
        this.selectedProperty = this.queryGridService.getProperty()
        this.gridName = this.queryGridService.getGridName()
        this.gridParam = this.queryGridService.getGridParam()
        this.availableGrids = this.selectGridService.getAvailableGrids(this.selectedProperty)
       }
      })
  }

  getPropertyViewValue(param: string): string {
    const viewValue = this.availableProperties.find( (p) => p.param === param )['viewValue']
    console.log('property viewValue:', viewValue, 'param', param)
    return viewValue
  }

  sendGrid(): void {
    let broadcastChange = !this.paramMode
    this.selectGridService.getGridMeta(this.gridName).subscribe( (gridMetas: GridMeta[] )=> {
      //quietly check the pressure level and update pressure if invalid.
      if (!gridMetas[0].presLevels.includes(this.queryGridService.getPresLevel())) {
        this.queryGridService.send_pres(gridMetas[0].presLevels[0], false)
      }
      this.queryGridService.sendGrid(this.gridName, false)
      this.selectGridService.gridMetaChange.emit(gridMetas[0])

      //safe to update grid and broadcast change.
      this.queryGridService.sendGrid(this.gridName, broadcastChange)
    })
  }

  selChange(gridName: string ): void {
    this.gridName = gridName
    this.changeGridParams(gridName)
    this.sendGrid();
  }

  changeProperty(property: string): void {
    this.selectedProperty = property
    this.changeColorScale(property) // change colorscale to default
    this.availableGrids = this.selectGridService.getAvailableGrids(this.selectedProperty)
    this.queryGridService.sendProperty(this.selectedProperty)
  }

  changeColorScale(selectedProperty: string): void {
    const colorScale = this.availableProperties.find(g => (g.param === selectedProperty))['colorScale']
    this.queryGridService.sendColorScale(colorScale, false)
  }

  changeGridParams(gridName: string): void {
    const obj = this.availableGridParams.find(o => o.grid === gridName);
    if (obj){
      const gridParams = obj.params
      this.gridName = obj.grid
      this.gridParams = gridParams
    }
    else {
      this.gridParams = []
    }
  }

  gridParamSelected(value: string): void {
    this.gridParam = value;
    const notifyChange = true
    this.queryGridService.sendGridParam(this.gridName, this.gridParam, notifyChange)
  }

}
