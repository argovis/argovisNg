import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthSubtrahendPickerComponent } from './month-subtrahend-picker.component';

describe('MonthSubtrahendPickerComponent', () => {
  let component: MonthSubtrahendPickerComponent;
  let fixture: ComponentFixture<MonthSubtrahendPickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthSubtrahendPickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthSubtrahendPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
