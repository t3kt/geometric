import {BuildContext} from "../../geometric/model";
import {paper} from 'paper';
import * as _ from 'lodash';

export class BuildModel {
  context: BuildContext;
  basisPoly: BuildPoly;
  polyGroups: BuildGroup[];
  lineBridgeGroups: BuildGroup[];

  constructor({context, basisPoly, polyGroups, lineBridgeGroups}) {
    this.context = context;
    this.basisPoly = basisPoly;
    this.polyGroups = polyGroups || [];
    this.lineBridgeGroups = lineBridgeGroups || [];
  }

  static fromBuildContext(context: BuildContext) {
    const polyGroups: BuildGroup[] = [];
    const lineBridgeGroups: BuildGroup[] = [];
    _.forEach(context.polyGroupsById, (group, groupId) => {
      polyGroups.push(BuildGroup.fromPaperGroup(context, group, {id: groupId}));
    });
    _.forEach(context.lineBridgeGroupsById, (group, groupId) => {
      lineBridgeGroups.push(BuildGroup.fromPaperGroup(context, group, {id: groupId}));
    });
    return new BuildModel({
      context: context,
      basisPoly: BuildPoly.fromPaperPath(context, context.basisPoly, {}),
      polyGroups: polyGroups,
      lineBridgeGroups: lineBridgeGroups,
    });
  }
}

export abstract class BuildNode<T extends paper.Item> {
  context: BuildContext;
  name: string;
  item: T;
  data: object;
  annotations: paper.Group;
  index: number;

  protected constructor({context, name = null, item = null, data = null, index = null}) {
    this.context = context;
    this.name = name;
    this.item = item;
    this.data = data || {};
    this.index = index || 0;
  }

  highlight() {
    this.context.paper.project.deselectAll();
    this.item.fullySelected = true;
  }

  get annotationsVisible(): boolean {
    return this.annotations != null && this.annotations.visible;
  }

  set annotationsVisible(visible: boolean) {
    this.setAnnotationsVisible(visible);
  }

  protected setAnnotationsVisible(visible: boolean) {
    if (this.annotations) {
      this.annotations.visible = visible;
    }
  }
}

export class BuildGroup extends BuildNode<paper.Group> {
  id: string;
  polys: BuildPoly[];
  subGroups: BuildGroup[];

  constructor({context, item, id, name, data, polys, subGroups, index}) {
    super({context, name, item, data, index});
    this.id = id;
    this.polys = polys || [];
    this.subGroups = subGroups || [];
  }

  protected setAnnotationsVisible(visible: boolean) {
    super.setAnnotationsVisible(visible);
    for (let poly of this.polys) {
      poly.annotationsVisible = visible;
    }
    for (let subGroup of this.subGroups) {
      subGroup.annotationsVisible = visible;
    }
  }

  static fromPaperGroup(context: BuildContext, group: paper.Group, {id = null, index = null}) {
    const polys: BuildPoly[] = [];
    const subGroups: BuildGroup[] = [];

    _.forEach(group.children, (child, childIndex) => {
      if (child instanceof paper.Group) {
        subGroups.push(BuildGroup.fromPaperGroup(context, child, {index: childIndex}));
      } else if (child instanceof paper.Path) {
        polys.push(BuildPoly.fromPaperPath(context, child, {index: childIndex}));
      }
    });

    return new BuildGroup({
      context: context,
      item: group,
      id: id,
      index: index,
      name: group.name,
      data: _.cloneDeep(group.data),
      polys: polys,
      subGroups: subGroups,
    });
  }
}

export class BuildPoly extends BuildNode<paper.Path> {
  numSides: number;
  data: Map<string, any>;

  constructor({context, item, name, numSides, data, index = null}) {
    super({context, item, name, data, index});
    this.name = name;
    this.numSides = numSides;
    this.data = data || {};
  }

  static fromPaperPath(context: BuildContext, path: paper.Path, {index = null}) {
    return new BuildPoly({
      context: context,
      item: path,
      index: index,
      name: path.name,
      numSides: path.segments.length,
      data: _.cloneDeep(path.data),
    });
  }
}
