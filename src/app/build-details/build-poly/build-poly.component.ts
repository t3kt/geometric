import {Component, Input, OnInit} from '@angular/core';
import {PolyInfo} from "../../model/BuildInfoModel";
import {EditorModel} from "../../model/EditorModel";

@Component({
  selector: 'build-poly',
  templateUrl: './build-poly.component.html',
  styleUrls: ['./build-poly.component.css']
})
export class BuildPolyComponent implements OnInit {

  constructor(private editorModel: EditorModel) { }

  @Input()
  polyInfo: PolyInfo;

  ngOnInit() {
  }

  highlight() {
    this.editorModel.setHighlightedItem(this.polyInfo.paperPath);
  }

}
