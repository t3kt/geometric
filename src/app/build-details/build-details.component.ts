import {Component, OnInit} from '@angular/core';
import {EditorModel} from "../model/EditorModel";
import {paper} from 'paper';
import {BuildModel} from "../model/BuildModel";

@Component({
  selector: 'build-details',
  templateUrl: './build-details.component.html',
  styleUrls: ['./build-details.component.css']
})
export class BuildDetailsComponent implements OnInit {

  constructor(private editorModel: EditorModel) {
    editorModel.buildInfo.changed.subscribe((info)=> {
      this.buildInfo = info;
    });
  }

  buildInfo: BuildModel;

  ngOnInit() {
  }

}
