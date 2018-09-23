import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildPolyComponent } from './build-poly.component';

describe('BuildPolyComponent', () => {
  let component: BuildPolyComponent;
  let fixture: ComponentFixture<BuildPolyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuildPolyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildPolyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
