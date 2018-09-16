import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {GeoDisplayComponent} from './geo-display/geo-display.component';
import {EditorModel} from "./model/EditorModel";
import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatTabsModule,
  MatToolbarModule
} from "@angular/material";
import {EditorToolbarComponent} from './editor-toolbar/editor-toolbar.component';
import {EditorPanelComponent} from './editor-panel/editor-panel.component';
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    AppComponent,
    GeoDisplayComponent,
    EditorToolbarComponent,
    EditorPanelComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatToolbarModule,
    FormsModule,
  ],
  providers: [EditorModel],
  bootstrap: [AppComponent]
})
export class AppModule {
}
