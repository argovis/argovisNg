import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ShapePopupComponent } from './shape-popup.component';
import { QueryService } from '../services/query.service';
import { RouterTestingModule } from '@angular/router/testing';
describe('ShapePopupComponent', () => {
  let component: ShapePopupComponent;
  let fixture: ComponentFixture<ShapePopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShapePopupComponent ],
      providers: [ QueryService], 
      imports: [
        RouterTestingModule,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate selection page url properly', () => {
    let url = component['generate_url'](false)

    expect(url.includes('startDate=')).toEqual(true)
    expect(url.includes('endDate')).toEqual(true)
    expect(url.includes('/page')).toEqual(false)
    url = component['generate_url'](true)
    expect(url.includes('/page')).toEqual(true)
    expect(url.includes('&presRange=0,2000')).toEqual(true)
    expect(url.includes('&bgcOnly=true')).toEqual(false)
    expect(url.includes('&deepOnly=true')).toEqual(false)

    component['presRangeChange'](false)
    component['bgc_only_change'](true)
    component['deep_only_change'](true)
    url = component['generate_url'](true)
    expect(url.includes('&presRange=0,2000')).toEqual(false)
    expect(url.includes('&bgcOnly=true')).toEqual(true)
    expect(url.includes('&deepOnly=true')).toEqual(true)
  })
});
