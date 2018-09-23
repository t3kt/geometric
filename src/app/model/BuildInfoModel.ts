import {BuildContext} from "../../geometric/model";
import {paper} from 'paper';
import * as _ from 'lodash';

export class DocBuildInfo {
  basisPoly: PolyInfo;
  polyGroups: GroupInfo[];
  lineBridgeGroups: GroupInfo[];

  constructor({basisPoly, polyGroups, lineBridgeGroups}) {
    this.basisPoly = basisPoly;
    this.polyGroups = polyGroups || [];
    this.lineBridgeGroups = lineBridgeGroups || [];
  }

  static fromBuildContext(context: BuildContext) {
    const polyGroups: GroupInfo[] = [];
    const lineBridgeGroups: GroupInfo[] = [];
    _.forEach(context.polyGroupsById, (group, groupId) => {
      polyGroups.push(GroupInfo.fromPaperGroup(group, groupId));
    });
    _.forEach(context.lineBridgeGroupsById, (group, groupId)=> {
      lineBridgeGroups.push(GroupInfo.fromPaperGroup(group, groupId));
    });
    return new DocBuildInfo({
      basisPoly: PolyInfo.fromPaperPath(context.basisPoly),
      polyGroups: polyGroups,
      lineBridgeGroups: lineBridgeGroups,
    });
  }
}

export class GroupInfo {
  id: string;
  name: string;
  paperGroup: paper.Group;
  data: Map<string, any>;
  polys: PolyInfo[];
  subGroups: GroupInfo[];

  constructor({paperGroup, id, name, data, polys, subGroups}) {
    this.paperGroup = paperGroup;
    this.id = id;
    this.name = name;
    this.data = data || {};
    this.polys = polys || [];
    this.subGroups = subGroups || [];
  }

  static fromPaperGroup(group: paper.Group, id=null) {
    const polys: PolyInfo[] = [];
    const subGroups: GroupInfo[] = [];

    for (let child of group.children) {
      if (child instanceof paper.Group) {
        subGroups.push(GroupInfo.fromPaperGroup(child));
      } else if (child instanceof paper.Path) {
        polys.push(PolyInfo.fromPaperPath(child));
      }
    }

    return new GroupInfo({
      paperGroup: group,
      id: id,
      name: group.name,
      data: _.cloneDeep(group.data),
      polys: polys,
      subGroups: subGroups,
    });
  }
}

export class PolyInfo {
  paperPath: paper.Path;
  name: string;
  numSides: number;
  data: Map<string, any>;

  constructor({paperPath, name, numSides, data}) {
    this.paperPath = paperPath;
    this.name = name;
    this.numSides = numSides;
    this.data = data || {};
  }

  static fromPaperPath(path: paper.Path) {
    return new PolyInfo({
      paperPath: path,
      name: path.name,
      numSides: path.segments.length,
      data: _.cloneDeep(path.data),
    });
  }
}
