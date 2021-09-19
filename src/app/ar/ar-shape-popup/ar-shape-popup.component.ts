import { Component, OnInit, Input } from '@angular/core'
import { ArQueryService } from './../ar-query.service'
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ar-shape-popup',
  templateUrl: './ar-shape-popup.component.html',
  styleUrls: ['./ar-shape-popup.component.css']
})
export class ArShapePopupComponent implements OnInit {
  @Input() shape: number[][][]
  @Input() transformedShape: number[][]
  @Input() message: string
  @Input() shape_id: string
  public bgcOnlyToggle: boolean
  public deepOnlyToggle: boolean
 
  public color: string
  public jsonButtonText: string
  public shapeButtonText: string

  constructor( private arQueryService: ArQueryService ) { }
  
  ngOnInit(): void {
    this.color = 'primary';
    this.jsonButtonText = "Download JSON Data"
    this.bgcOnlyToggle = false
    this.deepOnlyToggle = false
    this.shapeButtonText = "To Selection Page"
    this.query_ar_shape()
  }

  public bgc_only_change(bgcOnlyToggle: boolean): void {
    this.bgcOnlyToggle = bgcOnlyToggle
  }

  public deep_only_change(deepOnlyToggle: boolean): void {
    this.deepOnlyToggle = deepOnlyToggle
  }

  public query_ar_shape(): void {
    const broadcastChange = true
    const toggle3DayOff = false // should already be off
    let shapes = this.arQueryService.get_shapes()
    shapes? shapes.push(this.shape[0]) : shapes = this.shape

    this.arQueryService.send_shape(shapes, broadcastChange, toggle3DayOff)
  }

  public generate_url(goToPage: boolean): string {
    let url = '/selection/profiles'
    if (goToPage) {
      url += '/page'
    }
    let dates = this.arQueryService.get_selection_dates();
    url += '?startDate=' + dates.startDate + '&endDate=' + dates.endDate
    if (this.bgcOnlyToggle) {
      url += '&bgcOnly=true'
    }
    if (this.deepOnlyToggle) {
      url += '&deepOnly=true'
    }
    url += '&shape='+JSON.stringify(this.transformedShape)
    return url 
  }

  public generate_homepage_url(): string {
    let url = '/ng/home?'
    const dateRange = this.arQueryService.get_ar_date_as_date_range()
    url += '&selectionStartDate=' + dateRange.startDate + '&selectionEndDate=' + dateRange.endDate
    url += '&includeRealtime=' + JSON.stringify(this.arQueryService.get_realtime_toggle()) +
     '&onlyBGC=' + JSON.stringify(this.arQueryService.get_bgc_toggle()) + 
     '&onlyDeep=' + JSON.stringify(this.arQueryService.get_deep_toggle()) + '&threeDayToggle=false'
    const shapeString = JSON.stringify(this.shape)
    url += '&shapes=' + shapeString
     return url
  }

  public go_to_selection_page(goToPage: boolean): void {
    const url = this.generate_url(goToPage)
    window.open(url,"_blank")
  }

  public go_to_shape_json(): void {
    const windowURL = environment.apiRoot + '/arShapes/findByID?_id=' + this.shape_id
    window.open(windowURL,"_blank")
  } 

  public go_to_home_page(): void {
    const url = this.generate_homepage_url()
    window.open(url, "_blank")
  }
}
