import {parseDocument, GeoDocument} from '../../geometric/model';
import {EventEmitter, Injectable} from "@angular/core";
import * as paper from 'paper';
import {ObservableValue} from './observableValue';

@Injectable({
  providedIn: "root",
})
export class EditorModel {

  readonly changed = new EventEmitter();

  readonly doc = new ObservableValue<GeoDocument>();
  readonly size = new ObservableValue<paper.Size>(new paper.Size(800, 800));

  constructor() {
    this.doc.changed.subscribe(() => this.changed.emit());
    this.size.changed.subscribe(() => this.changed.emit());
  }

  public parseDocument(obj) {
    this.doc.value = parseDocument(obj);
  }
}
