import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GeoDisplayComponent } from './geo-display/geo-display.component';
import {EditorModel} from "./model/EditorModel";

@NgModule({
  declarations: [
    AppComponent,
    GeoDisplayComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule
  ],
  providers: [EditorModel],
  bootstrap: [AppComponent]
})
export class AppModule { }
