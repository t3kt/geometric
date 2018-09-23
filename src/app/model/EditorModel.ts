import {parseDocument, GeoDocument, BuildContext} from '../../geometric/model';
import {EventEmitter, Injectable} from "@angular/core";
import * as paper from 'paper';
import {ObservableValue} from './observableValue';

@Injectable({
  providedIn: "root",
})
export class EditorModel {

  readonly changed = new EventEmitter();
  readonly built = new EventEmitter();

  readonly doc = new ObservableValue<GeoDocument>();
  readonly size = new ObservableValue<paper.Size>(new paper.Size(800, 800));
  buildContext: BuildContext;

  readonly paperScope: paper.PaperScope = paper;

  constructor() {
    this.doc.changed.subscribe(() => this.changed.emit());
    this.size.changed.subscribe(() => this.changed.emit());
  }

  public initBuildContext() {
    this.buildContext = new BuildContext({
      paper: this.paperScope,
      width: this.size.value.width,
      height: this.size.value.height,
    });
  }

  public parseDocument(obj) {
    this.doc.value = parseDocument(obj);
  }

  public notifyBuilt() {
    this.built.emit();
  }

  private forEachDescendantItem(context: paper.Item, action) {
    if (context.children) {
      for (let child of context.children) {
        action(child);
        this.forEachDescendantItem(child, action);
      }
    }
  }

  public setHighlightedItem(highlightItem?: paper.Item) {
    this.paperScope.project.deselectAll();
    if (highlightItem) {
      this.setItemHighlighted(highlightItem, true);
    }
  }

  private setItemHighlighted(item: paper.Item, highlighted: boolean) {
    item.fullySelected = highlighted;
    // if (highlighted) {
    //   item.style.selectedColor = 'red';
    // }
  }
}
