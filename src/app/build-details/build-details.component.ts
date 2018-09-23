import {Component, OnInit} from '@angular/core';
import {EditorModel} from "../model/EditorModel";
import {paper} from 'paper';
import {DocBuildInfo} from "../model/BuildInfoModel";

@Component({
  selector: 'build-details',
  templateUrl: './build-details.component.html',
  styleUrls: ['./build-details.component.css']
})
export class BuildDetailsComponent implements OnInit {

  constructor(private editorModel: EditorModel) {
    editorModel.built.subscribe(() => this.update());
  }

  buildInfo: DocBuildInfo;

  ngOnInit() {
  }


  update() {
    const context = this.editorModel.buildContext;
    if (!context || !context.basisPoly) {
      this.buildInfo = null;
    } else {
      this.buildInfo = DocBuildInfo.fromBuildContext(context);
    }
  }

}
