"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var paper_1 = require("paper");
var _ = require("lodash");
var util = require("./util");
var Edge = /** @class */ (function () {
    function Edge(pt1, pt2) {
        this.pt1 = pt1;
        this.pt2 = pt2;
    }
    Edge.fromSegment = function (segment) {
        return new Edge(segment.point, segment.previous.point);
    };
    Edge.prototype.interp = function (ratio, flip) {
        if (flip === void 0) { flip = false; }
        if (flip) {
            ratio = 1 - ratio;
        }
        return util.interpPoints(this.pt1, this.pt2, ratio);
    };
    return Edge;
}());
var EdgeGroup = /** @class */ (function () {
    function EdgeGroup(edges, _a) {
        var name = _a.name;
        this.edges = edges;
        this.name = name;
    }
    return EdgeGroup;
}());
var EdgePair = /** @class */ (function () {
    function EdgePair(edge1, edge2) {
        this.edge1 = edge1;
        this.edge2 = edge2;
        // TODO: name?
    }
    return EdgePair;
}());
var EdgePairGroup = /** @class */ (function () {
    function EdgePairGroup(edgePairs, _a) {
        var name = _a.name;
        this.edgePairs = edgePairs;
        this.name = name;
    }
    return EdgePairGroup;
}());
var Attrs = /** @class */ (function () {
    function Attrs(opts) {
        if (opts === void 0) { opts = null; }
        opts = opts || {};
        this.style = new paper_1.paper.Style(_.pick(opts, util.styleFields));
        this.showNumbers = opts.showNumbers;
        this.opacity = opts.opacity;
        this.tags = opts.tags;
    }
    Attrs.prototype.applyTo = function (item) {
        item.style = this.style;
        if (this.opacity != null) {
            item.opacity = this.opacity;
        }
        if (this.tags) {
            item.data.tags = this.tags;
        }
    };
    Attrs.of = function (obj) {
        if (!obj) {
            return new Attrs({});
        }
        if (obj instanceof Attrs) {
            return obj;
        }
        if (obj instanceof String) {
            return new Attrs({ strokeColor: obj });
        }
        obj = util.stripIgnoredItems(obj);
        return new Attrs(obj);
    };
    return Attrs;
}());
function postProcessIndices(indices, total, wrap) {
    var results = [];
    for (var _i = 0, indices_1 = indices; _i < indices_1.length; _i++) {
        var i = indices_1[_i];
        if (i < 0 || i >= total) {
            if (wrap) {
                i %= total;
            }
            else {
                continue;
            }
        }
        if (results.indexOf(i) === -1) {
            results.push(i);
        }
    }
    return results;
}
var IndexSelector = /** @class */ (function () {
    function IndexSelector() {
    }
    IndexSelector.prototype.getIndices = function (total) {
        return _.range(total);
    };
    IndexSelector.of = function (obj) {
        obj = obj || {};
        if (obj instanceof IndexSelector || _.isFunction(obj.getIndices)) {
            return obj;
        }
        if (_.isArray(obj)) {
            obj = { indices: obj };
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
    };
    return IndexSelector;
}());
var IndexListSelector = /** @class */ (function (_super) {
    __extends(IndexListSelector, _super);
    function IndexListSelector(_a) {
        var _b = _a.indices, indices = _b === void 0 ? [] : _b, _c = _a.wrap, wrap = _c === void 0 ? false : _c;
        var _this = _super.call(this) || this;
        _this.indices = indices;
        _this.wrap = wrap;
        return _this;
    }
    IndexListSelector.prototype.getIndices = function (total) {
        return postProcessIndices(this.indices, total, this.wrap);
    };
    return IndexListSelector;
}(IndexSelector));
var IndexRangeSelector = /** @class */ (function (_super) {
    __extends(IndexRangeSelector, _super);
    function IndexRangeSelector(_a) {
        var _b = _a.start, start = _b === void 0 ? 0 : _b, end = _a.end, _c = _a.step, step = _c === void 0 ? 1 : _c, _d = _a.wrap, wrap = _d === void 0 ? false : _d;
        var _this = _super.call(this) || this;
        _this.start = start;
        _this.end = end;
        _this.step = step;
        _this.wrap = wrap;
        return _this;
    }
    IndexRangeSelector.prototype.getIndices = function (total) {
        var end;
        if (_.isNil(this.end)) {
            end = total;
        }
        else if (this.end < 0) {
            end = (total - this.end) % total;
        }
        else {
            end = this.end;
        }
        var indices;
        if (!this.wrap || this.step === 1) {
            indices = _.range(this.start, end, this.step);
        }
        else {
            indices = [];
            if (this.end === total) {
                indices = _.take(_.range(this.start, end), total, this.step);
            }
            else {
                // TODO: STUFF!
                throw new Error('not implemented: ranges with wrapping, end point, and step != 1');
            }
        }
        return postProcessIndices(indices, total, this.wrap);
    };
    return IndexRangeSelector;
}(IndexSelector));
var BuildContext = /** @class */ (function () {
    function BuildContext(_a) {
        var paper = _a.paper, _b = _a.width, width = _b === void 0 ? 500 : _b, _c = _a.height, height = _c === void 0 ? 500 : _c;
        this.paper = paper;
        this.width = width;
        this.height = height;
        this.basisPoly = null;
        this.polyGroupsById = {};
        this.lineBridgeGroupsById = {};
        this.currentGeneratorIndex = 0;
    }
    BuildContext.prototype.getSourcePolys = function (key) {
        if (!key) {
            return this.basisPoly ? [this.basisPoly] : [];
        }
        var group = this.polyGroupsById[key];
        if (!group) {
            return [];
        }
        return group.children;
    };
    BuildContext.prototype.addPolyGroup = function (id, polys, attrs) {
        if (!polys || !polys.length) {
            return;
        }
        var group = new this.paper.Group(polys);
        attrs && attrs.applyTo(group);
        if (id) {
            this.polyGroupsById[id] = group;
        }
    };
    BuildContext.prototype.addLineBridgeGroup = function (id, bridges, attrs) {
        if (!bridges || !bridges.length) {
            return;
        }
        var group = new this.paper.Group(bridges);
        attrs && attrs.applyTo(group);
        if (id) {
            this.lineBridgeGroupsById[id] = group;
        }
    };
    return BuildContext;
}());
var Basis = /** @class */ (function () {
    function Basis(_a) {
        var id = _a.id, attrs = _a.attrs;
        this.id = id;
        this.attrs = Attrs.of(attrs);
    }
    Basis.prototype.build = function (context) {
    };
    Basis.of = function (obj) {
        if (obj instanceof Basis || _.isFunction(obj.build)) {
            return obj;
        }
        obj = obj || {};
        obj = util.stripIgnoredItems(obj);
        if (obj.sides) {
            return new RegularPolyBasis(obj);
        }
        throw new Error('Unsupported basis type: ' + JSON.stringify(obj));
    };
    return Basis;
}());
var RegularPolyBasis = /** @class */ (function (_super) {
    __extends(RegularPolyBasis, _super);
    function RegularPolyBasis(_a) {
        var _b = _a.sides, sides = _b === void 0 ? 6 : _b, _c = _a.radius, radius = _c === void 0 ? 0.5 : _c, _d = _a.center, center = _d === void 0 ? [0.5, 0.5] : _d, id = _a.id, attrs = _a.attrs;
        var _this = _super.call(this, { id: id, attrs: attrs }) || this;
        _this.sides = sides;
        _this.radius = radius;
        _this.center = center;
        return _this;
    }
    RegularPolyBasis.prototype.build = function (context) {
        var width = context.width, height = context.height, paper = context.paper;
        var center;
        if (!this.center) {
            center = [width / 2, height / 2];
        }
        else {
            center = [width * this.center[0], height * this.center[1]];
        }
        var radius = (_.isNil(this.radius) ? 0.5 : this.radius) * _.min([width, height]);
        var poly = new paper.Path.RegularPolygon({
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
        this.attrs && this.attrs.applyTo(poly);
        poly.name = '_basis';
        context.basisPoly = poly;
        return poly;
    };
    return RegularPolyBasis;
}(Basis));
var EdgeSource = /** @class */ (function () {
    function EdgeSource(_a) {
        var from = _a.from, _b = _a.tags, tags = _b === void 0 ? [] : _b, opts = __rest(_a, ["from", "tags"]);
        this.from = from;
        this.tags = tags;
        this.selector = IndexSelector.of(opts);
    }
    EdgeSource.prototype.getEdgeGroups = function (context) {
        var selector = this.selector;
        return _(context.getSourcePolys(this.from))
            .map(function (poly) {
            return new EdgeGroup(_.map(selector.getIndices(poly.segments.length), function (i) { return Edge.fromSegment(poly.segments[i]); }), { name: poly.name });
        })
            .filter(function (edgeGroup) { return edgeGroup.edges.length; })
            .value();
    };
    EdgeSource.of = function (obj) {
        obj = obj || {};
        if (obj instanceof EdgeSource || _.isFunction(obj.getEdgeGroups)) {
            return obj;
        }
        if (_.isString(obj)) {
            obj = { from: obj };
        }
        obj = util.stripIgnoredItems(obj);
        return new EdgeSource(obj);
    };
    return EdgeSource;
}());
var EdgePairSource = /** @class */ (function () {
    function EdgePairSource(_a) {
        var _b = _a.tags, tags = _b === void 0 ? [] : _b;
        this.tags = tags;
    }
    EdgePairSource.of = function (obj) {
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
    };
    return EdgePairSource;
}());
var ZippedEdgePairSource = /** @class */ (function (_super) {
    __extends(ZippedEdgePairSource, _super);
    function ZippedEdgePairSource(_a) {
        var source1 = _a.source1, source2 = _a.source2, _b = _a.tags, tags = _b === void 0 ? [] : _b;
        var _this = _super.call(this, { tags: tags }) || this;
        _this.source1 = EdgeSource.of(source1);
        _this.source2 = EdgeSource.of(source2);
        return _this;
    }
    ZippedEdgePairSource.prototype.getEdgePairGroups = function (context) {
        var edgeGroups1 = this.source1.getEdgeGroups(context);
        var edgeGroups2 = this.source2.getEdgeGroups(context);
        if (edgeGroups1.length !== edgeGroups2.length) {
            throw new Error('Mismatch in edge group list lengths: ' +
                edgeGroups1.length + ' != ' + edgeGroups2.length);
        }
        var pairGroups = [];
        for (var groupIndex = 0; groupIndex < edgeGroups1.length; groupIndex++) {
            var edgeGroup1 = edgeGroups1[groupIndex];
            var edgeGroup2 = edgeGroups2[groupIndex];
            if (edgeGroup1.edges.length !== edgeGroup2.edges.length) {
                throw new Error('Mismatch in edge group lengths at index ' + groupIndex + ': ' +
                    edgeGroup1.edges.length + ' != ' + edgeGroup2.edges.length);
            }
            var pairGroup = new EdgePairGroup(_.zipWith(edgeGroup1.edges, edgeGroup2.edges, function (edge1, edge2) { return new EdgePair(edge1, edge2); }), { name: edgeGroup1.name + '::' + edgeGroup2.name });
            pairGroups.push(pairGroup);
        }
        return pairGroups;
    };
    return ZippedEdgePairSource;
}(EdgePairSource));
var SequentialEdgePairSource = /** @class */ (function (_super) {
    __extends(SequentialEdgePairSource, _super);
    function SequentialEdgePairSource(_a) {
        var source = _a.source, _b = _a.wrap, wrap = _b === void 0 ? true : _b, _c = _a.tags, tags = _c === void 0 ? [] : _c;
        var _this = _super.call(this, { tags: tags }) || this;
        _this.wrap = wrap;
        _this.source = EdgeSource.of(source);
        return _this;
    }
    SequentialEdgePairSource.prototype.getEdgePairGroups = function (context) {
        var wrap = this.wrap;
        return _(this.source.getEdgeGroups(context))
            .map(function (edgeGroup, edgeGroupIndex) {
            var edges = edgeGroup.edges;
            var secondEdges;
            if (wrap) {
                secondEdges = _.slice(edges, 1).concat([edges[0]]);
            }
            else {
                secondEdges = _.slice(edges, 1);
                edges = _.slice(edges, 0, edges.length - 1);
            }
            // TODO: names
            return new EdgePairGroup(_.zipWith(edges, secondEdges, function (edge1, edge2) { return new EdgePair(edge1, edge2); }), { name: null });
        })
            .filter(function (pairGroup) { return pairGroup.edgePairs.length; })
            .value();
    };
    return SequentialEdgePairSource;
}(EdgePairSource));
var Generator = /** @class */ (function () {
    function Generator(_a) {
        var id = _a.id, attrs = _a.attrs;
        this.id = id;
        this.attrs = Attrs.of(attrs);
    }
    Generator.of = function (obj) {
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
        throw new Error('unsupported generator type: ' + JSON.stringify(obj));
    };
    return Generator;
}());
var RegularPolyOnEdgeGenerator = /** @class */ (function (_super) {
    __extends(RegularPolyOnEdgeGenerator, _super);
    function RegularPolyOnEdgeGenerator(_a) {
        var id = _a.id, attrs = _a.attrs, _b = _a.sides, sides = _b === void 0 ? 6 : _b, _c = _a.flip, flip = _c === void 0 ? false : _c, source = _a.source;
        var _this = _super.call(this, { id: id, attrs: attrs }) || this;
        _this.sides = sides;
        _this.flip = flip;
        _this.source = EdgeSource.of(source);
        return _this;
    }
    RegularPolyOnEdgeGenerator.prototype.generate = function (context) {
        var edgeGroups = this.source.getEdgeGroups(context);
        var generatedPolys = [];
        var namePrefix = (this.id || ('__gen_' + context.currentGeneratorIndex)) + '-group';
        for (var edgeGroupIndex = 0; edgeGroupIndex < edgeGroups.length; edgeGroupIndex++) {
            var edgeGroup = edgeGroups[edgeGroupIndex];
            var groupNamePrefix = namePrefix + edgeGroupIndex + '-poly';
            for (var edgeIndex = 0; edgeIndex < edgeGroup.edges.length; edgeIndex++) {
                var edge = edgeGroup.edges[edgeIndex];
                var poly = util.createPolyAtCorners(context.paper, edge.pt1, edge.pt2, this.sides, this.flip, this.attrs);
                poly.name = groupNamePrefix + edgeIndex;
                generatedPolys.push(poly);
            }
        }
        context.addPolyGroup(this.id, generatedPolys, this.attrs);
    };
    return RegularPolyOnEdgeGenerator;
}(Generator));
var LineBridgeGenerator = /** @class */ (function (_super) {
    __extends(LineBridgeGenerator, _super);
    function LineBridgeGenerator(_a) {
        var _b = _a.steps, steps = _b === void 0 ? 4 : _b, _c = _a.flip1, flip1 = _c === void 0 ? false : _c, _d = _a.flip2, flip2 = _d === void 0 ? false : _d, source = _a.source, id = _a.id, attrs = _a.attrs;
        var _this = _super.call(this, { id: id, attrs: attrs }) || this;
        _this.steps = steps;
        _this.flip1 = flip1;
        _this.flip2 = flip2;
        _this.source = EdgePairSource.of(source);
        return _this;
    }
    LineBridgeGenerator.prototype.generate = function (context) {
        var edgePairGroups = this.source.getEdgePairGroups(context);
        var generatedBridges = [];
        var namePrefix = (this.id || ('__gen_' + context.currentGeneratorIndex)) + '-group';
        for (var edgePairGroupIndex = 0; edgePairGroupIndex < edgePairGroups.length; edgePairGroupIndex++) {
            var edgePairGroup = edgePairGroups[edgePairGroupIndex];
            var groupNamePrefix = namePrefix + edgePairGroupIndex + '-bridge';
            for (var edgePairIndex = 0; edgePairIndex < edgePairGroup.edgePairs.length; edgePairIndex++) {
                var edgePair = edgePairGroup.edgePairs[edgePairIndex];
                var bridge = util.createLineBridgeBetweenEdges(context.paper, edgePair.edge1, edgePair.edge2, this.steps, this.flip1, this.flip2, this.attrs);
                bridge.name = groupNamePrefix + edgePairIndex;
                generatedBridges.push(bridge);
            }
        }
        context.addLineBridgeGroup(this.id, generatedBridges, this.attrs);
    };
    return LineBridgeGenerator;
}(Generator));
var GeoDocument = /** @class */ (function () {
    function GeoDocument(_a) {
        var name = _a.name, _b = _a.meta, meta = _b === void 0 ? {} : _b, _c = _a.base, base = _c === void 0 ? {} : _c, _d = _a.generators, generators = _d === void 0 ? [] : _d;
        this.name = name;
        this.meta = _.cloneDeep(meta || {});
        this.base = Basis.of(base);
        this.generators = _.map(util.stripIgnoredItems(generators), Generator.of);
    }
    GeoDocument.prototype.build = function (paper, width, height) {
        if (width === void 0) { width = 500; }
        if (height === void 0) { height = 500; }
        var context = new BuildContext({ paper: paper, width: width, height: height });
        this.base.build(context);
        for (var _i = 0, _a = this.generators; _i < _a.length; _i++) {
            var generator = _a[_i];
            generator.generate(context);
            context.currentGeneratorIndex++;
        }
    };
    return GeoDocument;
}());
exports.GeoDocument = GeoDocument;
function parseDocument(obj) {
    var doc = new GeoDocument(util.stripIgnoredItems(obj));
    return doc;
}
exports.parseDocument = parseDocument;
