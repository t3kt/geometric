import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {EditorModel} from '../model/EditorModel';
import {PaperScope} from 'paper';

@Component({
  selector: 'geo-display',
  templateUrl: './geo-display.component.html',
  styleUrls: ['./geo-display.component.css']
})
export class GeoDisplayComponent implements OnInit {

  @ViewChild('geoCanvas')
  canvas: ElementRef;

  constructor(private editorModel: EditorModel) {
    editorModel.changed.subscribe(() => this.render());
  }

  ngOnInit() {
    this.editorModel.paperScope.setup(this.canvas.nativeElement);
    this.render();
  }

  render() {
    const paper = this.editorModel.paperScope;
    paper.project.clear();
    const doc = this.editorModel.doc.value;
    this.editorModel.initBuildContext();
    if (!doc) {
      this.editorModel.notifyBuilt();
      return;
    }
    paper.view.viewSize.set(this.editorModel.buildContext.width, this.editorModel.buildContext.height);
    doc.buildDoc(this.editorModel.buildContext);
    paper.view.draw();
    this.editorModel.notifyBuilt();
  }

}
