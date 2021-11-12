import { Component, OnInit, Input } from '@angular/core'
import { QueryService } from '../services/query.service'
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-shape-popup',
  templateUrl: './shape-popup.component.html',
  styleUrls: ['./shape-popup.component.css']
})
export class ShapePopupComponent implements OnInit {
  @Input() shape: number[][][]
  @Input() transformedShape: number[][]
  @Input() message: string
  @Input() shape_id: string
  public color: string
  public presRangeToggle: boolean
  public bgcOnlyToggle: boolean
  public deepOnlyToggle: boolean
  public pageToggle: boolean
  public shapeButtonText: string
  public jsonButtonText: string
  constructor(private queryService: QueryService) { }

  ngOnInit() {
    this.color = 'primary';
    this.presRangeToggle = true
    this.bgcOnlyToggle = false
    this.deepOnlyToggle = false
    this.shapeButtonText = "To Selection Page"
    this.jsonButtonText = "Download JSON Data"
  }

  public presRangeChange(presRangeToggle: boolean): void {
    this.presRangeToggle = presRangeToggle;
  }

  public bgc_only_change(bgcOnlyToggle: boolean): void {
    this.bgcOnlyToggle = bgcOnlyToggle
  }

  public deep_only_change(deepOnlyToggle: boolean): void {
    this.deepOnlyToggle = deepOnlyToggle
  }

  public pageChange(pageToggle: boolean): void {
    this.pageToggle = pageToggle
  }

  public generate_url(goToPage: boolean): string {
    let url = environment.dpRoot + '/selection/profiles'
    if (goToPage) {
      url += '/page'
    }
    let dates = this.queryService.get_selection_dates();
    url += '?startDate=' + dates.startDate + '&endDate=' + dates.endDate
    if (this.presRangeToggle) {
      const presRange = this.queryService.get_pres_range();
      url += '&presRange='+presRange[0] + ',' + presRange[1]
    }
    if (this.bgcOnlyToggle) {
      url += '&bgcOnly=true'
    }
    if (this.deepOnlyToggle) {
      url += '&deepOnly=true'
    }
    url += '&polygon='+JSON.stringify(this.transformedShape).slice(1,-1)
    return url 
  }

  public go_to_selection_page(goToPage: boolean): void {
    const url = this.generate_url(goToPage)
    window.open(url,"_blank")
  }



}
