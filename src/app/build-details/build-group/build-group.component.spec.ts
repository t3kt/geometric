import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildGroupComponent } from './build-group.component';

describe('BuildGroupComponent', () => {
  let component: BuildGroupComponent;
  let fixture: ComponentFixture<BuildGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuildGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
