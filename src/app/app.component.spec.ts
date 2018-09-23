import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import {EditorToolbarComponent} from "./editor-toolbar/editor-toolbar.component";
import {GeoDisplayComponent} from "./geo-display/geo-display.component";
import {EditorPanelComponent} from "./editor-panel/editor-panel.component";
import {BuildDetailsComponent} from "./build-details/build-details.component";
import {BuildGroupComponent} from "./build-details/build-group/build-group.component";
import {BuildPolyComponent} from "./build-details/build-poly/build-poly.component";
import {
  MatButton,
  MatFormField,
  MatSlideToggle,
  MatTab,
  MatTabGroup,
  MatTabHeader,
  MatToolbar
} from "@angular/material";
import {NgModel} from "@angular/forms";
describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        GeoDisplayComponent,
        EditorToolbarComponent,
        EditorPanelComponent,
        BuildDetailsComponent,
        BuildGroupComponent,
        BuildPolyComponent,
        MatToolbar,
        NgModel,
        MatFormField,
        MatTab,
        MatTabGroup,
        MatTabHeader,
        MatSlideToggle,
        MatButton,
      ],
    }).compileComponents();
  }));
  // it('should create the app', async(() => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   const app = fixture.debugElement.componentInstance;
  //   expect(app).toBeTruthy();
  // }));
  // it(`should have as title 'geometric-app'`, async(() => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   const app = fixture.debugElement.componentInstance;
  //   expect(app.title).toEqual('geometric-app');
  // }));
  // it('should render title in a h1 tag', async(() => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   fixture.detectChanges();
  //   const compiled = fixture.debugElement.nativeElement;
  //   expect(compiled.querySelector('h1').textContent).toContain('Welcome to geometric-app!');
  // }));
});
