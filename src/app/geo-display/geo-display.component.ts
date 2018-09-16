import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {EditorModel} from '../model/EditorModel';
import {paper, PaperScope} from 'paper';

@Component({
  selector: 'geo-display',
  templateUrl: './geo-display.component.html',
  styleUrls: ['./geo-display.component.css']
})
export class GeoDisplayComponent implements OnInit {

  @ViewChild('geoCanvas')
  canvas: ElementRef;

  private readonly _paper: PaperScope;

  constructor(private editorModel: EditorModel) {
    editorModel.changed.subscribe(() => this.render());
    this._paper = paper;
  }

  ngOnInit() {
    this._paper.setup(this.canvas.nativeElement);
    this.render();
  }

  render() {
    this._paper.project.clear();
    const doc = this.editorModel.doc.value;
    if (!doc) {
      return;
    }
    const size = this.editorModel.size.value;
    this._paper.view.viewSize.set(size.width, size.height);
    doc.build(this._paper, size.width, size.height);
    this._paper.view.draw();
  }

}
