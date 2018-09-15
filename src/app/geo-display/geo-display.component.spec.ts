import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeoDisplayComponent } from './geo-display.component';

describe('GeoDisplayComponent', () => {
  let component: GeoDisplayComponent;
  let fixture: ComponentFixture<GeoDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeoDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeoDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
