import {Component, Input} from '@angular/core';
import {BuildGroup} from "../../model/BuildModel";
import {EditorModel} from "../../model/EditorModel";

@Component({
  selector: 'build-group',
  templateUrl: './build-group.component.html',
  styleUrls: ['./build-group.component.css']
})
export class BuildGroupComponent {

  constructor(private editorModel: EditorModel) { }

  @Input()
  groupInfo: BuildGroup;


  highlight() {
    this.editorModel.setHighlightedItem(this.groupInfo.item);
  }
}
