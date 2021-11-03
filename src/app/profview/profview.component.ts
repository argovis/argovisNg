import { Component, OnInit, Injector } from '@angular/core';
import { QueryProfviewService } from './query-profview.service'
import { NotifierService } from 'angular-notifier'


@Component({
  selector: 'app-profview',
  templateUrl: './profview.component.html',
  styleUrls: ['./profview.component.css']
})
export class ProfviewComponent implements OnInit {
  public selectedIndex: number
  public readonly notifier: NotifierService
  public notifierService: NotifierService

  constructor(private queryProfviewService: QueryProfviewService,
              public injector: Injector) {  this.notifierService = injector.get(NotifierService)
                                            this.notifier = this.notifierService }

  ngOnInit(): void {
    this.selectedIndex = this.queryProfviewService.selectedIndex //init will change soon

    this.queryProfviewService.urlParsed.subscribe( (msg: string) => {
      this.selectedIndex = this.queryProfviewService.selectedIndex
    } )
    this.notifier.notify( 'info', 'Select some profiles from the table below to start plotting.' )
  }

  on_tab_click(index: number): void {
    this.selectedIndex = index
    this.queryProfviewService.selectedIndex = this.selectedIndex
    console.log(this.queryProfviewService.selectedIndex)
    this.queryProfviewService.set_url()
    this.queryProfviewService.urlParsed.emit('tab changed in url')
  }

}
