import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, HttpClientModule, HttpHandler } from '@angular/common/http';
import { VarplotComponent } from './varplot.component';
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRoute } from '@angular/router';

describe('VarplotComponent', () => {
  let component: VarplotComponent;
  let fixture: ComponentFixture<VarplotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VarplotComponent ],
      providers: [ 
        HttpClientTestingModule, 
        HttpTestingController, 
        HttpClient, 
        HttpClientModule,
        HttpHandler
      ],
      imports: [ RouterTestingModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VarplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
