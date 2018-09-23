import {paper} from 'paper';
import * as _ from 'lodash';
import * as util from './util';

class PolyGroup {
  name?: string;
  polys: paper.Path[];

  constructor({name, polys}) {
    this.name = name;
    this.polys = polys || [];
  }
}

class Edge {
  pt1: paper.Point;
  pt2: paper.Point;

  constructor(pt1, pt2) {
    this.pt1 = pt1;
    this.pt2 = pt2;
  }

  static fromSegment(segment) {
    return new Edge(
      segment.point,
      segment.previous.point);
  }

  interp(ratio, flip = false) {
    if (flip) {
      ratio = 1 - ratio;
    }
    return util.interpPoints(this.pt1, this.pt2, ratio);
  }
}

class EdgeGroup {
  edges: Edge[];
  name?: string;

  constructor(edges: Edge[], {name}) {
    this.edges = edges;
    this.name = name;
  }
}

class EdgePair {
  edge1: Edge;
  edge2: Edge;

  constructor(edge1: Edge, edge2: Edge) {
    this.edge1 = edge1;
    this.edge2 = edge2;
    // TODO: name?
  }
}

class EdgePairGroup {
  edgePairs: EdgePair[];
  name?: string;

  constructor(edgePairs, {name}) {
    this.edgePairs = edgePairs;
    this.name = name;
  }
}

class Attrs {

  constructor(opts = null) {
    opts = opts || {};
    this.style = new paper.Style(_.pick(opts, util.styleFields));
    this.showNumbers = opts.showNumbers;
    this.opacity = opts.opacity;
    this.tags = opts.tags;
  }

  style: paper.Style;
  showNumbers: boolean;
  opacity: number;
  tags: string[];

  static of(obj) {
    if (!obj) {
      return new Attrs({});
    }
    if (obj instanceof Attrs) {
      return obj;
    }
    if (obj instanceof String) {
      return new Attrs({strokeColor: obj});
    }
    obj = util.stripIgnoredItems(obj);
    return new Attrs(obj);
  }

  applyTo(item) {
    item.style = this.style;
    if (this.opacity != null) {
      item.opacity = this.opacity;
    }
    if (this.tags) {
      item.data.tags = this.tags;
    }
  }
}


function postProcessIndices(indices: number[], total: number, wrap: boolean) {
  const results: number[] = [];
  for (let i of indices) {
    if (i < 0 || i >= total) {
      if (wrap) {
        i %= total;
      } else {
        continue;
      }
    }
    if (results.indexOf(i) === -1) {
      results.push(i);
    }
  }
  return results;
}

class IndexSelector {

  static of(obj) {
    obj = obj || {};
    if (obj instanceof IndexSelector || _.isFunction(obj.getIndices)) {
      return obj;
    }
    if (_.isArray(obj)) {
      obj = {indices: obj};
    }
    obj = util.stripIgnoredItems(obj);
    if (obj.type === 'indices' || obj.indices) {
      return new IndexListSelector(obj);
    }
    if (obj.type === 'range' || !_.isNil(obj.start) || !_.isNil(obj.end) || !_.isNil(obj.step)) {
      return new IndexRangeSelector(obj);
    }
    if (!obj.type) {
      return new IndexSelector();
    }
    throw new Error('Unsupported index selector: ' + JSON.stringify(obj));
  }

  getIndices(total) {
    return _.range(total);
  }
}

export class IndexListSelector extends IndexSelector {
  indices: number[];
  wrap: boolean;

  constructor({indices = [], wrap = false}) {
    super();
    this.indices = indices;
    this.wrap = wrap;
  }

  getIndices(total) {
    return postProcessIndices(this.indices, total, this.wrap);
  }
}

export class IndexRangeSelector extends IndexSelector {
  start: number;
  end?: number;
  step: number;
  wrap: boolean;

  constructor({start = 0, end, step = 1, wrap = false}) {
    super();
    this.start = start;
    this.end = end;
    this.step = step;
    this.wrap = wrap;
  }

  getIndices(total) {
    let end;
    if (_.isNil(this.end)) {
      end = total;
    } else if (this.end < 0) {
      end = (total - this.end) % total;
    } else {
      end = this.end;
    }
    let indices;
    if (!this.wrap && this.step === 1) {
      indices = _.range(this.start, end, this.step);
    } else {
      indices = [];
      if (this.end === total) {
        indices = _.take(_.range(this.start, end), total, this.step);
      } else {
        let i = this.start;
        for (;;) {
          if (indices.indexOf(i) != -1) {
            break;
          }
          if (this.end != null && i >= (this.end % total)) {
            break;
          }
          indices.push(i);
          i = (i + this.step) % total;
        }
        return indices;
      }
    }
    return postProcessIndices(indices, total, this.wrap);
  }
}

export class BuildContext {
  paper: paper.PaperScope;
  width: number;
  height: number;
  basisPoly: paper.Path;
  polyGroupsById: { [key: string]: paper.Group };
  lineBridgeGroupsById: { [key: string]: paper.Group };
  currentGeneratorIndex: number;

  constructor({paper, width = 500, height = 500}) {
    this.paper = paper;
    this.width = width;
    this.height = height;
    this.basisPoly = null;
    this.polyGroupsById = {};
    this.lineBridgeGroupsById = {};
    this.currentGeneratorIndex = 0;
  }

  getSourcePolys(key?: string): paper.Path[] {
    if (!key) {
      return this.basisPoly ? [this.basisPoly] : [];
    }
    const group = this.polyGroupsById[key];
    return util.getPathsInGroup(group);
  }

  addPolyGroup(id: string, polys: paper.Path[], attrs?: Attrs) {
    if (!polys || !polys.length) {
      return;
    }
    const group = new this.paper.Group(polys);
    if (attrs) {
      attrs.applyTo(group);
    }
    if (id) {
      group.name = id;
      this.polyGroupsById[id] = group;
    }
  }

  addLineBridgeGroup(id: string, bridges: paper.Group[], attrs?: Attrs) {
    if (!bridges || !bridges.length) {
      return;
    }
    const group = new this.paper.Group(bridges);
    if (attrs) {
      attrs.applyTo(group);
    }
    if (id) {
      group.name = id;
      this.lineBridgeGroupsById[id] = group;
    }
  }
}

abstract class Basis {

  protected constructor({id, attrs}) {
    this.id = id;
    this.attrs = Attrs.of(attrs);
  }

  id: string;
  attrs?: Attrs;

  static of(obj): Basis {
    if (obj instanceof Basis || _.isFunction(obj.build)) {
      return obj;
    }
    obj = obj || {};
    obj = util.stripIgnoredItems(obj);
    if (obj.sides) {
      return new RegularPolyBasis(obj);
    }
    throw new Error('Unsupported basis type: ' + JSON.stringify(obj));
  }

  build(context: BuildContext) {
  }
}

class RegularPolyBasis extends Basis {
  sides: number;
  radius: number;
  center: number[];

  constructor({sides = 6, radius = 0.5, center = [0.5, 0.5], id, attrs}) {
    super({id, attrs});
    this.sides = sides;
    this.radius = radius;
    this.center = center;
  }

  build(context: BuildContext) {
    const {width, height, paper} = context;
    let center;
    if (!this.center) {
      center = [width / 2, height / 2];
    } else {
      center = [width * this.center[0], height * this.center[1]];
    }
    const radius = (_.isNil(this.radius) ? 0.5 : this.radius) * _.min([width, height]);
    const poly = new paper.Path.RegularPolygon({
      sides: this.sides || 6,
      radius: radius,
      center: center,
      data: {
        sides: this.sides,
        radius: this.radius,
        center: this.center,
        isBasis: true,
      }
    });
    if (this.attrs) {
      this.attrs.applyTo(poly);
    }
    poly.name = '_basis';
    context.basisPoly = poly;
    return poly;
  }
}

abstract class PolySource {
  protected constructor({name}) {
    this.name = name;
  }

  name?: string;

  abstract getPolyGroups(context: BuildContext): PolyGroup[];

  static of(obj): PolySource {
    obj = obj || {};
    if (obj instanceof PolySource || _.isFunction(obj.getPolyGroup)) {
      return obj;
    }
    if (_.isString(obj)) {
      obj = {from: obj};
    }
    if (_.isArray(obj)) {
      obj = {sources: obj};
    }
    obj = util.stripIgnoredItems(obj);
    if (obj.sources) {
      return new MultiPolySource(obj);
    }
    return new SinglePolySource(obj);
  }
}

class SinglePolySource extends PolySource {
  constructor({name, from, ...opts}) {
    super({name});
    this.from = from;
    this.selector = IndexSelector.of(opts);
  }

  from?: string;
  selector: IndexSelector;

  getPolyGroups(context: BuildContext): PolyGroup[] {
    const sourcePolys = context.getSourcePolys(this.from);
    const indices = this.selector.getIndices(sourcePolys.length);
    return [
      new PolyGroup({
        name: this.name,
        polys: _.map(indices, i => sourcePolys[i])
      })
    ];
  }
}

class MultiPolySource extends PolySource {
  constructor({name, sources}) {
    super({name});
    const namePrefix = this.name ? (this.name + '-') : '';
    this.sources = _.map(sources || [], (sourceObj, sourceIndex) => {
      return PolySource.of(
        _.extend({
          name: !namePrefix ? null :
            (namePrefix + (sourceObj.name || ('source-' + sourceIndex)))
        }, sourceObj));
    });
  }

  sources?: PolySource[];

  getPolyGroups(context: BuildContext): PolyGroup[] {
    return _(this.sources)
      .map((source) => source.getPolyGroups(context))
      .flatten()
      .value();
  }
}

class EdgeSource {

  constructor({name, from, tags = [], ...opts}) {
    this.name = name;
    this.from = PolySource.of(from);
    this.tags = tags;
    this.selector = IndexSelector.of(opts);
  }

  name?: string;
  from?: PolySource;
  tags: string[];
  selector: IndexSelector;

  static of(obj): EdgeSource {
    obj = obj || {};
    if (obj instanceof EdgeSource || _.isFunction(obj.getEdgeGroups)) {
      return obj;
    }
    if (_.isString(obj)) {
      obj = {from: obj};
    }
    obj = util.stripIgnoredItems(obj);
    return new EdgeSource(obj);
  }

  getEdgeGroups(context: BuildContext): EdgeGroup[] {
    const selector = this.selector;
    const namePrefix = this.name ? (this.name + '-') : '';
    return _(this.from.getPolyGroups(context))
      .map((polyGroup, polyGroupIndex) => {
        const polyGroupPrefix = namePrefix + (polyGroup.name || ('polygroup-' + polyGroupIndex));
        return _.map(polyGroup.polys, (poly, polyIndex) =>
          new EdgeGroup(
            _.map(selector.getIndices(poly.segments.length),
              i => Edge.fromSegment(poly.segments[i])), {
              name: polyGroupPrefix + (poly.name || ('group-' + polyIndex))
            }));
      })
      .flatten()
      .filter(edgeGroup => edgeGroup.edges.length)
      .value();
  }
}

abstract class EdgePairSource {

  protected constructor({tags = []}) {
    this.tags = tags;
  }

  tags: string[];

  static of(obj): EdgePairSource {
    obj = obj || {};
    if (obj instanceof EdgePairSource || _.isFunction(obj.getEdgePairGroups)) {
      return obj;
    }

    obj = util.stripIgnoredItems(obj);
    if (obj.type === 'zip') {
      return new ZippedEdgePairSource(obj);
    }
    if (obj.type === 'seq') {
      return new SequentialEdgePairSource(obj);
    }
    throw new Error('Unsupported edge pair source: ' + JSON.stringify(obj));
  }

  abstract getEdgePairGroups(context): EdgePairGroup[];
}

class ZippedEdgePairSource extends EdgePairSource {
  source1: EdgeSource;
  source2: EdgeSource;

  constructor({source1, source2, tags = []}) {
    super({tags});
    this.source1 = EdgeSource.of(source1);
    this.source2 = EdgeSource.of(source2);
  }

  getEdgePairGroups(context: BuildContext): EdgePairGroup[] {
    const edgeGroups1 = this.source1.getEdgeGroups(context);
    const edgeGroups2 = this.source2.getEdgeGroups(context);
    if (edgeGroups1.length !== edgeGroups2.length) {
      throw new Error('Mismatch in edge group list lengths: ' +
        edgeGroups1.length + ' != ' + edgeGroups2.length);
    }
    const pairGroups = [];
    for (let groupIndex = 0; groupIndex < edgeGroups1.length; groupIndex++) {
      const edgeGroup1 = edgeGroups1[groupIndex];
      const edgeGroup2 = edgeGroups2[groupIndex];
      if (edgeGroup1.edges.length !== edgeGroup2.edges.length) {
        throw new Error('Mismatch in edge group lengths at index ' + groupIndex + ': ' +
          edgeGroup1.edges.length + ' != ' + edgeGroup2.edges.length);
      }
      const pairGroup = new EdgePairGroup(
        _.zipWith(edgeGroup1.edges, edgeGroup2.edges, (edge1, edge2) => new EdgePair(edge1, edge2)),
        {name: edgeGroup1.name + '::' + edgeGroup2.name});
      pairGroups.push(pairGroup);
    }
    return pairGroups;
  }
}

class SequentialEdgePairSource extends EdgePairSource {
  wrap: boolean;
  source: EdgeSource;

  constructor({source, wrap = true, tags = []}) {
    super({tags});
    this.wrap = wrap;
    this.source = EdgeSource.of(source);
  }

  getEdgePairGroups(context: BuildContext): EdgePairGroup[] {
    const wrap = this.wrap;
    return _(this.source.getEdgeGroups(context))
      .map((edgeGroup, edgeGroupIndex) => {
        let edges = edgeGroup.edges;
        let secondEdges;
        if (wrap) {
          secondEdges = _.slice(edges, 1).concat([edges[0]]);
        } else {
          secondEdges = _.slice(edges, 1);
          edges = _.slice(edges, 0, edges.length - 1);
        }
        // TODO: names
        return new EdgePairGroup(
          _.zipWith(edges, secondEdges, (edge1, edge2) => new EdgePair(edge1, edge2)),
          {name: null});

      })
      .filter(pairGroup => pairGroup.edgePairs.length)
      .value();
  }
}


abstract class Generator {

  protected constructor({id, attrs}) {
    this.id = id;
    this.attrs = Attrs.of(attrs);
  }

  id?: string;
  attrs?: Attrs;

  static of(obj): Generator {
    obj = obj || {};
    if (obj instanceof Generator || _.isFunction(obj.generate)) {
      return obj;
    }
    obj = util.stripIgnoredItems(obj);
    if (!obj.type || obj.type === 'regPolyOnEdge') {
      return new RegularPolyOnEdgeGenerator(obj);
    }
    if (obj.type === 'lineBridgeOnEdge') {
      return new LineBridgeGenerator(obj);
    }
    if (obj.type == 'rhombusOnEdgePair') {
      return new RhombusOnEdgesGenerator(obj);
    }
    throw new Error('unsupported generator type: ' + JSON.stringify(obj));
  }

  abstract generate(context: BuildContext): void;
}

class RegularPolyOnEdgeGenerator extends Generator {
  sides: number;
  flip: boolean;
  source: EdgeSource;

  constructor({id, attrs, sides = 6, flip = false, source}) {
    super({id, attrs});
    this.sides = sides;
    this.flip = flip;
    this.source = EdgeSource.of(source);
  }

  generate(context: BuildContext) {
    const edgeGroups = this.source.getEdgeGroups(context);
    const generatedPolys = [];
    const namePrefix = (this.id || ('__gen_' + context.currentGeneratorIndex)) + '-group';
    for (let edgeGroupIndex = 0; edgeGroupIndex < edgeGroups.length; edgeGroupIndex++) {
      const edgeGroup = edgeGroups[edgeGroupIndex];
      const groupNamePrefix = namePrefix + edgeGroupIndex + '-poly';
      for (let edgeIndex = 0; edgeIndex < edgeGroup.edges.length; edgeIndex++) {
        const edge = edgeGroup.edges[edgeIndex];
        const poly = util.createPolyAtCorners(context.paper,
          edge.pt1, edge.pt2, this.sides, this.flip, this.attrs);
        poly.name = groupNamePrefix + edgeIndex;
        _.assign(poly.data, {
          generatorType: 'regPolyOnEdge',
          outputType: 'poly',
          sides: this.sides,
          flip: this.flip,
        });
        generatedPolys.push(poly);
      }
    }
    context.addPolyGroup(this.id, generatedPolys, this.attrs);
  }
}

class RhombusOnEdgesGenerator extends Generator {
  source: EdgePairSource;

  constructor({id, attrs, source}) {
    super({id, attrs});
    this.source = EdgePairSource.of(source);
  }

  generate(context: BuildContext) {
    const edgePairGroups = this.source.getEdgePairGroups(context);
    const generatedPolys = [];
    const namePrefix = (this.id || ('__gen_' + context.currentGeneratorIndex)) + '-group';
    const attrs = this.attrs;
    _.forEach(edgePairGroups, (edgePairGroup, edgePairGroupIndex) => {
      const groupNamePrefix = namePrefix + edgePairGroupIndex + '-bridge';
      _.forEach(edgePairGroup.edgePairs, (edgePair, edgePairIndex) => {
       const e1pt1 = edgePair.edge1.pt1;
       const e1pt2 = edgePair.edge1.pt2;
       const e2pt1 = edgePair.edge2.pt1;
       const e2pt2 = edgePair.edge2.pt2;
        let pt1;
        let pt2;
        let pt3;
        if (e1pt1.equals(e2pt1)) {
          pt1 = e1pt2;
          pt2 = e1pt1;
          pt3 = e2pt2;
        } else if (e1pt1.equals(e2pt2)) {
          pt1 = e1pt2;
          pt2 = e1pt1;
          pt3 = e2pt1;
        } else if (e1pt2.equals(e2pt1)) {
          pt1 = e1pt1;
          pt2 = e1pt2;
          pt3 = e2pt2;
        } else if (e1pt2.equals(e2pt2)) {
          pt1 = e1pt1;
          pt2 = e1pt2;
          pt3 = e2pt1;
        } else {
          throw new Error('Invalid rhombus edges [' + e1pt1 + ', ' + e1pt2 + '] [' + e2pt1 + ', ' + e2pt2 + ']');
        }
        const poly = util.createRhombusFromCorners(context.paper, pt1, pt2, pt3, attrs);
        poly.name = groupNamePrefix + edgePairIndex;
        _.assign(poly.data, {
          generatorType: 'rhombusOnEdgePair',
          outputType: 'poly',
        });
        generatedPolys.push(poly);
      });
    });
    context.addPolyGroup(this.id, generatedPolys, this.attrs);
  }
}

class LineBridgeGenerator extends Generator {
  steps: number;
  flip1: boolean;
  flip2: boolean;
  source: EdgePairSource;

  constructor({steps = 4, flip1 = false, flip2 = false, source, id, attrs}) {
    super({id, attrs});
    this.steps = steps;
    this.flip1 = flip1;
    this.flip2 = flip2;
    this.source = EdgePairSource.of(source);
  }

  generate(context: BuildContext) {
    const edgePairGroups = this.source.getEdgePairGroups(context);
    const generatedBridges = [];
    const namePrefix = (this.id || ('__gen_' + context.currentGeneratorIndex)) + '-group';
    for (let edgePairGroupIndex = 0; edgePairGroupIndex < edgePairGroups.length; edgePairGroupIndex++) {
      const edgePairGroup = edgePairGroups[edgePairGroupIndex];
      const groupNamePrefix = namePrefix + edgePairGroupIndex + '-bridge';
      for (let edgePairIndex = 0; edgePairIndex < edgePairGroup.edgePairs.length; edgePairIndex++) {
        const edgePair = edgePairGroup.edgePairs[edgePairIndex];
        const bridge = util.createLineBridgeBetweenEdges(
          context.paper, edgePair.edge1, edgePair.edge2, this.steps, this.flip1, this.flip2, this.attrs);
        bridge.name = groupNamePrefix + edgePairIndex;
        _.assign(bridge.data, {
          generatorType: 'lineBridgeOnEdge',
          outputType: 'lineBridge',
          steps: this.steps,
          flip1: this.flip1,
          flip2: this.flip2,
        });
        generatedBridges.push(bridge);
      }
    }
    context.addLineBridgeGroup(this.id, generatedBridges, this.attrs);
  }
}

export class GeoDocument {
  name: string;
  meta: Object;
  base: Basis;
  generators: Generator[];

  constructor({name, meta = {}, base = {}, generators = []}) {
    this.name = name;
    this.meta = _.cloneDeep(meta || {});
    this.base = Basis.of(base);
    this.generators = _.map(util.stripIgnoredItems(generators), Generator.of);
  }

  buildDoc(context: BuildContext) {
    this.base.build(context);
    for (const generator of this.generators) {
      generator.generate(context);
      context.currentGeneratorIndex++;
    }
  }
}

export function parseDocument(obj): GeoDocument {
  return new GeoDocument(util.stripIgnoredItems(obj));
}

