import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VarplotComponent } from './varplot.component';

describe('VarplotComponent', () => {
  let component: VarplotComponent;
  let fixture: ComponentFixture<VarplotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VarplotComponent ]
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
