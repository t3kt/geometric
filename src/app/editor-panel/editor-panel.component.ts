import {Component, OnInit} from '@angular/core';
import {EditorModel} from "../model/EditorModel";
import {buildJsonFromItem} from "../../geometric/exporter";

@Component({
  selector: 'editor-panel',
  templateUrl: './editor-panel.component.html',
  styleUrls: ['./editor-panel.component.css']
})
export class EditorPanelComponent implements OnInit {

  constructor(private readonly editorModel: EditorModel) {
  }

  specText: string = '';
  outputText: string = '';

  ngOnInit() {
  }

  applyChanges() {
    const specObj = JSON.parse(this.specText);
    this.editorModel.parseDocument(specObj);
  }

  generateSvg() {
    const doc = this.editorModel.doc.value;
    if (!doc) {
      this.outputText = '';
    } else {
      this.outputText = this.editorModel.paperScope.project.exportSVG({asString: true});
    }
  }

  generateJson() {
    const doc = this.editorModel.doc.value;
    if (!doc) {
      this.outputText = '';
    } else {
      const outObj = buildJsonFromItem(this.editorModel.paperScope);
      this.outputText = JSON.stringify(outObj, null, '  ');
    }
  }

}
