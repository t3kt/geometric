import {Component, Input, OnInit} from '@angular/core';
import {BuildPoly} from "../../model/BuildModel";
import {EditorModel} from "../../model/EditorModel";

@Component({
  selector: 'build-poly',
  templateUrl: './build-poly.component.html',
  styleUrls: ['./build-poly.component.css']
})
export class BuildPolyComponent implements OnInit {

  constructor(private editorModel: EditorModel) { }

  @Input()
  polyInfo: BuildPoly;

  ngOnInit() {
  }

  highlight() {
    this.editorModel.setHighlightedItem(this.polyInfo.item);
  }

}
