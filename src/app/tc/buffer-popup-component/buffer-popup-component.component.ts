import { DateRange } from './../../../typeings/daterange.d';
import { TcQueryService } from './../tc-query.service';
import { Component, OnInit, Input } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-buffer-popup-component',
  templateUrl: './buffer-popup-component.component.html',
  styleUrls: ['./buffer-popup-component.component.css']
})

export class BufferPopupComponentComponent implements OnInit {
  @Input() shape: number[][][]
  @Input() transformedShape: number[][][]
  @Input() message: string
  @Input() shape_id: string
  public bgcOnlyToggle: boolean
  public deepOnlyToggle: boolean
 
  public color: string
  public jsonButtonText: string
  public shapeButtonText: string

  constructor( private tcQueryService: TcQueryService ) { }

  ngOnInit(): void {
    this.color = 'primary';
    this.jsonButtonText = "Download JSON Data"
    this.bgcOnlyToggle = false
    this.deepOnlyToggle = false
    this.shapeButtonText = "To Selection Page"
  }

  public bgc_only_change(bgcOnlyToggle: boolean): void {
    this.bgcOnlyToggle = bgcOnlyToggle
  }

  public deep_only_change(deepOnlyToggle: boolean): void {
    this.deepOnlyToggle = deepOnlyToggle
  }

  public generate_url(goToPage: boolean): string {
    let url = environment.dpRoot + '/selection/profiles'
    if (goToPage) {
      url += '/page'
    }
    const dateRange = this.tcQueryService.get_prof_date_range()
    url += '?startDate=' + dateRange.startDate + '&endDate=' + dateRange.endDate
    if (this.bgcOnlyToggle) {
      url += '&bgcOnly=true'
    }
    if (this.deepOnlyToggle) {
      url += '&deepOnly=true'
    }
    if(this.transformedShape) {
      url += '&polygon='+JSON.stringify(this.transformedShape).slice(1,-1)
    }
    return url 
  }

  public generate_homepage_url(): string {
    let url = '/ng/home?'
    const dateRange = this.tcQueryService.get_prof_date_range()
    url += '&selectionStartDate=' + dateRange.startDate + '&selectionEndDate=' + dateRange.endDate
    url += '&includeRealtime=' + JSON.stringify(this.tcQueryService.get_realtime_toggle()) +
     '&onlyBGC=' + JSON.stringify(this.tcQueryService.get_bgc_toggle()) + 
     '&onlyDeep=' + JSON.stringify(this.tcQueryService.get_deep_toggle()) + '&threeDayToggle=false'
    const shapeString = JSON.stringify(this.shape)
    url += '&shapes=' + shapeString
     return url
  }

  public go_to_selection_page(goToPage: boolean): void {
    const url = this.generate_url(goToPage)
    window.open(url,"_blank")
  }

  public go_to_home_page(): void {
    const url = this.generate_homepage_url()
    window.open(url, "_blank")
  }

}
