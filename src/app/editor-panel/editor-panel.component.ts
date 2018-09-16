import {Component, OnInit} from '@angular/core';
import {EditorModel} from "../model/EditorModel";

@Component({
  selector: 'editor-panel',
  templateUrl: './editor-panel.component.html',
  styleUrls: ['./editor-panel.component.css']
})
export class EditorPanelComponent implements OnInit {

  constructor(private readonly editorModel: EditorModel) {
  }

  specText: string = '';

  ngOnInit() {
  }

  applyChanges() {
    const specObj = JSON.parse(this.specText);
    this.editorModel.parseDocument(specObj);
  }

}
