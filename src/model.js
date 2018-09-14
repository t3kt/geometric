Geo.model = (function () {
    const {Point, Style} = paper;
    const {util} = Geo;

    class Attrs {
        constructor(opts = null) {
            opts = opts || {};
            this.style = new Style(_.pick(opts, util.styleFields));
            this.showNumbers = opts.showNumbers;
            this.opacity = opts.opacity;
            this.tags = opts.tags;
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
            return new Attrs(obj);
        }
    }

    class Edge {
        constructor(pt1 = new Point(), pt2 = new Point()) {
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
        constructor(edges, {name}) {
            this.edges = edges;
            this.name = name;
        }
    }

    class EdgePair {
        constructor(edge1, edge2) {
            this.edge1 = edge1;
            this.edge2 = edge2;
            // TODO: name?
        }
    }

    class EdgePairGroup {
        constructor(edgePairs, {name}) {
            this.edgePairs = edgePairs;
            this.name = name;
        }
    }

    class IndexSelector {
        constructor() {
        }

        getIndices(total) {
            return _.range(total);
        }

        static of(obj) {
            obj = obj || {};
            if (obj instanceof IndexSelector || _.isFunction(obj.getIndices)) {
                return obj;
            }
            if (_.isArray(obj)) {
                obj = {indices: obj};
            }
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
    }

    function postProcessIndices(indices, total, wrap) {
        const results = [];
        for (let i of indices) {
            if (i < 0 || i >= total) {
                if (wrap) {
                    i %= total;
                } else {
                    continue;
                }
            }
            if (!_.includes(results, i)) {
                results.push(i);
            }
        }
        return results;
    }

    class IndexListSelector extends IndexSelector {
        constructor({indices = [], wrap = false}) {
            super();
            this.indices = indices;
            this.wrap = wrap;
        }

        getIndices(total) {
            return postProcessIndices(this.indices, total, this.wrap);
        }
    }

    class IndexRangeSelector extends IndexSelector {
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
            if (!this.wrap || this.step === 1) {
                indices = _.range(this.start, end, this.step);
            } else {
                indices = [];
                if (this.end === total) {
                    indices = _.take(_.range(this.start, end), total, this.step);
                } else {
                    // TODO: STUFF!
                    throw new Error('not implemented: ranges with wrapping, end point, and step != 1');
                }
            }
            return postProcessIndices(indices, total, this.wrap);
        }
    }

    class BuildContext {
        constructor({paper, width = 500, height = 500}) {
            this.paper = paper;
            this.width = width;
            this.height = height;
            this.basisPoly = null;
            this.polyGroupsById = {};
            this.lineBridgeGroupsById = {};
            this.currentGeneratorIndex = 0;
        }

        getSourcePolys(key) {
            if (!key) {
                return this.basisPoly ? [this.basisPoly] : [];
            }
            let group = this.polyGroupsById[key];
            if (!group) {
                return [];
            }
            return group.children;
        }

        addPolyGroup(id, polys, attrs) {
            if (!polys || !polys.length) {
                return;
            }
            let group = new this.paper.Group(polys);
            attrs && attrs.applyTo(group);
            if (id) {
                this.polyGroupsById[id] = group;
            }
        }

        addLineBridgeGroup(id, bridges, attrs) {
            if (!bridges || !bridges.length) {
                return;
            }
            let group = new this.paper.Group(bridges);
            attrs && attrs.applyTo(group);
            if (id) {
                this.lineBridgeGroupsById[id] = group;
            }
        }
    }

    class Basis {
        constructor({id, attrs}) {
            this.id = id;
            this.attrs = Attrs.of(attrs);
        }

        build(context) {
        }

        static of(obj) {
            if (obj instanceof Basis || _.isFunction(obj.build)) {
                return obj;
            }
            obj = obj || {};
            if (obj.sides) {
                return new RegularPolyBasis(obj);
            }
        }
    }

    class RegularPolyBasis extends Basis {
        constructor({sides = 6, radius = 0.5, center = [0.5, 0.5], id, attrs}) {
            super({id, attrs});
            this.sides = sides;
            this.radius = radius;
            this.center = center;
        }

        build(context) {
            let {width, height, paper} = context;
            let center;
            if (!this.center) {
                center = [width / 2, height / 2];
            } else {
                center = [width * this.center[0], height * this.center[1]];
            }
            let radius = (_.isNil(this.radius) ? 0.5 : this.radius) * _.min([width, height]);
            let poly = new paper.Path.RegularPolygon({
                sides: this.sides || 6,
                radius: radius,
                center: center,
                data: {
                    sides: this.sides,
                    radius: this.radius,
                    center: this.center,
                    isBasis: true,
                    tags: this.tags
                }
            });
            this.attrs && this.attrs.applyTo(poly);
            poly.name = '_basis';
            context.basisPoly = poly;
            return poly;
        }
    }

    class EdgeSource {
        constructor({from, tags = [], ...opts}) {
            this.from = from;
            this.tags = tags;
            this.selector = IndexSelector.of(opts);
        }

        getEdgeGroups(context) {
            let polys = context.getSourcePolys(this.from);
            if (!polys.length) {
                return [];
            }
            let edgeGroups = [];
            for (let poly of polys) {
                let indices = this.selector.getIndices(poly.segments.length);
                if (!indices.length) {
                    continue;
                }
                let edges = _.map(indices, i => Edge.fromSegment(poly.segments[i]));
                edgeGroups.push(new EdgeGroup(edges, {name: poly.name}));
            }
            return edgeGroups;
        }

        static of(obj) {
            obj = obj || {};
            if (obj instanceof EdgeSource || _.isFunction(obj.getEdgeGroups)) {
                return obj;
            }
            if (_.isString(obj)) {
                obj = {from: obj};
            }
            return new EdgeSource(obj);
        }
    }

    class EdgePairSource {
        constructor({tags = []}) {
            this.tags = tags;
        }

        getEdgePairGroups(context) {
        }

        static of(obj) {
            obj = obj || {};
            if (obj instanceof EdgePairSource || _.isFunction(obj.getEdgePairGroups)) {
                return obj;
            }

            if (obj.type === 'zip') {
                return new ZippedEdgePairSource(obj);
            }
            if (obj.type === 'seq') {
                return new SequentialEdgePairSource(obj);
            }
            throw new Error('Unsupported edge pair source: ' + JSON.stringify(obj));
        }
    }

    class ZippedEdgePairSource extends EdgePairSource {
        constructor({source1, source2, tags = []}) {
            super({tags});
            this.source1 = EdgeSource.of(source1);
            this.source2 = EdgeSource.of(source2);
        }

        getEdgePairGroups(context) {
            let edgeGroups1 = this.source1.getEdgeGroups(context);
            let edgeGroups2 = this.source2.getEdgeGroups(context);
            if (edgeGroups1.length !== edgeGroups2.length) {
                throw new Error('Mismatch in edge group list lengths: ' +
                    edgeGroups1.length + ' != ' + edgeGroups2.length);
            }
            let pairGroups = [];
            for (let groupIndex = 0; groupIndex < edgeGroups1.length; groupIndex++) {
                let edgeGroup1 = edgeGroups1[groupIndex];
                let edgeGroup2 = edgeGroups2[groupIndex];
                if (edgeGroup1.edges.length !== edgeGroup2.edges.length) {
                    throw new Error('Mismatch in edge group lengths at index ' + groupIndex + ': ' +
                        edgeGroup1.edges.length + ' != ' + edgeGroup2.edges.length);
                }
                let pairGroup = new EdgePairGroup(
                    _.zipWith(edgeGroup1.edges, edgeGroup2.edges, (edge1, edge2) => new EdgePair(edge1, edge2)),
                    {name: edgeGroup1.name + '::' + edgeGroup2.name});
                pairGroups.push(pairGroup);
            }
            return pairGroups;
        }
    }

    class SequentialEdgePairSource extends EdgePairSource {
        constructor({source, wrap = true, tags = []}) {
            super({tags});
            this.wrap = wrap;
            this.source = EdgeSource.of(source);
        }
    }

    class Generator {
        constructor({id, attrs}) {
            this.id = id;
            this.attrs = Attrs.of(attrs);
        }

        generate(context) {
        }

        static of(obj) {
            obj = obj || {};
            if (obj instanceof Generator || _.isFunction(obj.generate)) {
                return obj;
            }
            if (!obj.type || obj.type === 'regPolyOnEdge') {
                return new RegularPolyOnEdgeGenerator(obj);
            }
            if (obj.type === 'lineBridgeOnEdge') {
                return new LineBridgeGenerator(obj);
            }
            throw new Error('unsupported generator type: ' + JSON.stringify(obj));
        }
    }

    class RegularPolyOnEdgeGenerator extends Generator {
        constructor({id, attrs, sides = 6, flip = false, source}) {
            super({id, attrs});
            this.sides = sides;
            this.flip = flip;
            this.source = EdgeSource.of(source);
        }

        generate(context) {
            let edgeGroups = this.source.getEdgeGroups(context);
            let generatedPolys = [];
            let namePrefix = (this.id || ('__gen_' + context.currentGeneratorIndex)) + '-group';
            for (let edgeGroupIndex = 0; edgeGroupIndex < edgeGroups.length; edgeGroupIndex++) {
                let edgeGroup = edgeGroups[edgeGroupIndex];
                let groupNamePrefix = namePrefix + edgeGroupIndex + '-poly';
                for (let edgeIndex = 0; edgeIndex < edgeGroup.edges.length; edgeIndex++) {
                    let edge = edgeGroup.edges[edgeIndex];
                    let poly = util.createPolyAtCorners(context.paper,
                        edge.pt1, edge.pt2, this.sides, this.flip, this.attrs);
                    poly.name = groupNamePrefix + edgeIndex;
                    generatedPolys.push(poly);
                }
            }
            context.addPolyGroup(this.id, generatedPolys, this.attrs);
        }
    }

    class LineBridgeGenerator extends Generator {
        constructor({steps = 4, flip1 = false, flip2 = false, source, id, attrs}) {
            super({id, attrs});
            this.steps = steps;
            this.flip1 = flip1;
            this.flip2 = flip2;
            this.source = EdgePairSource.of(source);
        }

        generate(context) {
            let edgePairGroups = this.source.getEdgePairGroups(context);
            let generatedBridges = [];
            let namePrefix = (this.id || ('__gen_' + context.currentGeneratorIndex)) + '-group';
            for (let edgePairGroupIndex = 0; edgePairGroupIndex < edgePairGroups.length; edgePairGroupIndex++) {
                let edgePairGroup = edgePairGroups[edgePairGroupIndex];
                let groupNamePrefix = namePrefix + edgePairGroupIndex + '-bridge';
                for (let edgePairIndex = 0; edgePairIndex < edgePairGroup.edgePairs.length; edgePairIndex++) {
                    let edgePair = edgePairGroup.edgePairs[edgePairIndex];
                    let bridge = util.createLineBridgeBetweenEdges(
                        context.paper, edgePair.edge1, edgePair.edge2, this.steps, this.flip1, this.flip2, this.attrs);
                    bridge.name = groupNamePrefix + edgePairIndex;
                    generatedBridges.push(bridge);
                }
            }
            context.addLineBridgeGroup(this.id, generatedBridges, this.attrs);
        }
    }

    class GeoDocument {
        constructor({name, meta = {}, base = {}, generators = []}) {
            this.name = name;
            this.meta = _.cloneDeep(meta || {});
            this.base = Basis.of(base);
            this.generators = _.map(generators, Generator.of);
        }

        build(paper, width = 500, height = 500) {
            let context = new BuildContext({paper, width, height});
            this.base.build(context);
            for (let generator of this.generators) {
                generator.generate(context);
                context.currentGeneratorIndex++;
            }
        }
    }

    return {
        Attrs,
        Edge,
        GeoDocument,
    };
})();