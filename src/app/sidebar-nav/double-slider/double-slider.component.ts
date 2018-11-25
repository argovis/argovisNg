import { Component, OnInit} from '@angular/core';
import { QueryService } from '../../query.service'
import {ViewEncapsulation} from '@angular/core';


@Component({
  selector: 'app-double-slider',
  templateUrl: './double-slider.component.html',
  styleUrls: ['./double-slider.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DoubleSliderComponent implements OnInit {

  private config: any;
  private slider: any;
  private sliderRange: number[];
  private lRange: number;
  private uRange: number;
  //@ViewChild('slider') slider: NouisliderModule;


  constructor(private queryService: QueryService) {
    this.lRange = 0;
    this.uRange = 2000;
    this.sliderRange = [this.lRange, this.uRange];
   }

  ngOnInit() {
    this.config = {
      start: this.sliderRange,
      range: { min: 0, max: 6000 },
      step: 1,
      connect: true,
      orientation: 'vertical'
    }
  }

  private sendSliderRange(): void {
    this.queryService.sendPresMessage(this.sliderRange);
  }

  public minValuechange(newLowPres : number ): void {
    this.lRange = newLowPres;
    this.sliderRange = [newLowPres, null];
  }

  public maxValuechange(newUpPres : number ): void {
    this.uRange = newUpPres;
    this.sliderRange = [null, newUpPres];
  }

  public onChange(newRange: number[]): void {
    this.lRange = newRange[0]
    this.uRange = newRange[1]
    this.sendSliderRange();
  }

}
