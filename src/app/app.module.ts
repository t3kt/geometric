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
import { DocTreeComponent } from './doc-tree/doc-tree.component';
import {TreeNodeComponent} from "./doc-tree/tree-node/tree-node.component";
import { BuildDetailsComponent } from './build-details/build-details.component';
import { BuildGroupComponent } from './build-details/build-group/build-group.component';
import { BuildPolyComponent } from './build-details/build-poly/build-poly.component';

@NgModule({
  declarations: [
    AppComponent,
    GeoDisplayComponent,
    EditorToolbarComponent,
    EditorPanelComponent,
    BuildDetailsComponent,
    BuildGroupComponent,
    BuildPolyComponent,
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
