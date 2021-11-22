import { Component, OnInit } from '@angular/core';
import { QueryGridService } from '../../query-grid.service';
import { ColorScaleGroup } from '../../../../typeings/grids';

@Component({
  selector: 'app-grid-color-picker',
  templateUrl: './grid-color-picker.component.html',
  styleUrls: ['./grid-color-picker.component.css']
})
export class GridColorPickerComponent implements OnInit {
  constructor(private queryGridService: QueryGridService) { }
  public availableColorscales: ColorScaleGroup[]
  public colorScale: string
  public inverseColorScale: boolean

  ngOnInit() {
    this.availableColorscales = [
	  {viewValue: 'Balance', colorScale: 'balance'},
	  {viewValue: 'Blues', colorScale: 'Blues'},
	  {viewValue: 'Blue to Green', colorScale: 'BuGn'},
	  {viewValue: 'Blue to Purple', colorScale: 'BuPu'},
	  {viewValue: 'Greens', colorScale: 'Greens'},
	  {viewValue: 'Green to Blue', colorScale: 'GnBu'},
	  {viewValue: 'Greys', colorScale: 'Greys'},
	  {viewValue: 'Haline', colorScale: 'haline'},
	  {viewValue: 'Ice', colorScale: 'ice'},
	  {viewValue: 'Purple Blue Green', colorScale: 'PuBuGn'},
	  {viewValue: 'Purple to Red', colorScale: 'PuRd'},
	  {viewValue: 'Purples', colorScale: 'Purples'},
	  {viewValue: 'Oranges', colorScale: 'Oranges'},
	  {viewValue: 'Orange to Red', colorScale: 'OrRd'},
	  {viewValue: 'Reds', colorScale: 'Reds'},
	  {viewValue: 'Red Purple', colorScale: 'RdPu'},
      {viewValue: 'Red Yellow Blue', colorScale: 'RdYlBu'},
	  {viewValue: 'Thermal', colorScale: 'thermal'},
	  {viewValue: 'Yellow Orange Brown', colorScale: 'YlOrBr'},
	  {viewValue: 'Yellow Orange Red', colorScale: 'YlOrRd'}
    ]

    this.colorScale = this.queryGridService.getColorScale()
    this.inverseColorScale = this.queryGridService.getInverseColorScale()

    this.queryGridService.resetToStart
    .subscribe(msg => {
      this.colorScale = this.queryGridService.getColorScale()
    })
  }

  public changeColorScale(colorScale: string): void {
    const sendMessage = true
    this.colorScale = colorScale
    this.queryGridService.sendColorScale(this.colorScale, sendMessage)
  }

  public inverseColorScaleToggle(inverseColorScale: boolean): void {
    const sendMessage = true
    this.inverseColorScale = inverseColorScale
    this.queryGridService.sendInverseColorScale(this.inverseColorScale, sendMessage)
  }

}
