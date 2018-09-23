import {parseDocument, GeoDocument, BuildContext} from '../../geometric/model';
import * as util from '../../geometric/util';
import {EventEmitter, Injectable} from "@angular/core";
import * as paper from 'paper';
import {ObservableValue} from './observableValue';
import {BuildGroup, BuildModel, BuildNode, BuildPoly} from "./BuildModel";

@Injectable({
  providedIn: "root",
})
export class EditorModel {

  readonly changed = new EventEmitter();
  readonly built = new EventEmitter();

  readonly doc = new ObservableValue<GeoDocument>();
  readonly size = new ObservableValue<paper.Size>(new paper.Size(800, 800));
  buildContext: BuildContext;
  readonly buildInfo = new ObservableValue<BuildModel>();

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
    this.doc.value = obj ? parseDocument(obj) : null;
  }

  public notifyBuilt() {
    this.buildInfo.value = this.buildContext ? BuildModel.fromBuildContext(this.buildContext) : null;
    this.buildAnnotations();
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
      highlightItem.fullySelected = true;
    }
  }

  private getAnnotationsLayer() {
    for (let layer of this.paperScope.project.layers) {
      if (layer.name == '__annotations') {
        return layer;
      }
    }
    let layer = new paper.Layer({
      name: '__annotations',
      // visible: false,
      opacity: 0.9,
    });
    this.paperScope.project.addLayer(layer);
    return layer;
  }

  private buildAnnotations() {
    const layer = this.getAnnotationsLayer();
    layer.clear();
    const buildInfo = this.buildInfo.value;
    if (!buildInfo) {
      return;
    }
    if (buildInfo.basisPoly) {
      this.buildPolyAnnotations(buildInfo.basisPoly, layer);
    }
    for (let group of buildInfo.polyGroups) {
      this.buildGroupAnnotations(group, layer);
    }
  }

  private buildGroupAnnotations(group: BuildGroup, layer: paper.Layer) {
    if (group.data['outputType'] == 'lineBridge') {
      return;
    }
    for (let poly of group.polys) {
      this.buildPolyAnnotations(poly, layer);
    }
    for (let subGroup of group.subGroups) {
      this.buildGroupAnnotations(subGroup, layer);
    }
  }

  private initNodeAnnotationGroup<T extends paper.Item>(node: BuildNode<T>, layer: paper.Layer) {
    if (node.annotations) {
      node.annotations.remove();
    }
    node.annotations = new paper.Group({
      visible: false,
    });
    layer.addChild(node.annotations);
  }

  private buildPolyAnnotations(poly: BuildPoly, layer: paper.Layer) {
    this.initNodeAnnotationGroup(poly, layer);
    const polyIndexLabel = util.drawPolyIndex(this.paperScope, poly.item, poly.index);
    polyIndexLabel.name = 'polyIndexLabel';
    poly.annotations.addChild(polyIndexLabel);
    const edgeLabels = util.drawPolySegmentIndices(this.paperScope, poly.item);
    edgeLabels.name = 'edgeLabels';
    poly.annotations.addChild(edgeLabels);
  }
}
