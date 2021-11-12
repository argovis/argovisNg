import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GridSubtrahendPickerComponent } from './grid-subtrahend-picker.component';

describe('GridSubtrahendPickerComponent', () => {
  let component: GridSubtrahendPickerComponent;
  let fixture: ComponentFixture<GridSubtrahendPickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GridSubtrahendPickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GridSubtrahendPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
