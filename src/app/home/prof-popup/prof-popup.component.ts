import { Component, Input, OnInit } from '@angular/core';
import { QueryService } from '../services/query.service';
@Component({
  selector: 'app-prof-popup',
  templateUrl: './prof-popup.component.html',
  styleUrls: ['./prof-popup.component.css']
})
export class ProfPopupComponent {
  showBGC: boolean = false;
  show: boolean = false;
  constructor(private queryService: QueryService) {     
    if (this.bgc) {
    this.showBGC = true;
    }
  }

  // @Input() platform: string;
  // @Input() bgc: boolean;
  // @Input() lat: string;
  // @Input() lon: string;
  // @Input() date: string;
  // @Input() profileId: string;
  // @Input() unknownPos: boolean;

  @Input() param: string
  @Input() profileId: string
  @Input() lat: string
  @Input() lon: string
  @Input() cycle: string
  @Input() date: string
  @Input() platform: string
  @Input() dataMode: string
  @Input() bgc: boolean
  @Input() deep: boolean
  @Input() unknownPos: boolean
  @Input() dpRoot: string
  public introMsg = {}

  ngOnInit() {
    this.introMsg = "Hello, i'm " + this.profileId + "!"
    if (this.unknownPos) {
      this.introMsg += " My whereabouts are unknown!"
    }
    if (this.bgc) {
      console.log('includes bgc')
      this.showBGC = true;
      }
  }



  showPlatformsProfiles() {
    this.queryService.trigger_platform_show_event(this.platform)
  }

}
