const Geo = (function () {
    const {CompoundPath, Point, Path, PointText, Style} = paper;

    function generateGroup(context, {edges, generators, attrs}) {
        let edgeProviders = arrayify(edges || EdgeProvider.range({})).map(e => EdgeProvider.of(e));
        generators = arrayify(generators).map(g => Generator.of(g));
        attrs = arrayify(attrs || new Attrs({})).map(a => Attrs.of(a));
        context = arrayify(context);
        let items = [];
        for (let a of attrs) {
            for (let ctx of context) {
                if (ctx == null) {
                    continue;
                }
                for (let edgeProvider of edgeProviders) {
                    if (edgeProvider == null) {
                        continue;
                    }
                    let edges = edgeProvider.getEdges(ctx);
                    for (let generator of generators) {
                        if (generator == null) {
                            continue;
                        }
                        items.push(...generator.generate(ctx, edges, a));
                    }
                }
            }
        }
        return items;
    }

    class Attrs {
        constructor(opts = null) {
            this.style = new Style(_.pick(opts, [
                'strokeColor',
                'strokeWidth',
                'strokeCap',
                'strokeJoin',
                'strokeScaling',
                'dashOffset',
                'dashArray',
                'miterLimit',
                'fillColor',
                'fillRule',
                'shadowColor',
                'shadowOffset',
                'selectedColor',
                'fontFamily',
                'fontWeight',
                'fontSize',
                'leading',
                'justification',
            ]));
            this.showNumbers = opts.showNumbers;
        }

        applyTo(item) {
            item.style = this.style;
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
            return interpPoints(this.pt1, this.pt2, ratio);
        }
    }

    class EdgeProvider {
        constructor(getter) {
            this._getter = getter;
        }

        getEdges(context) {
            return this._getter(context);
        }

        static sides({sides, wrap = false}) {
            sides = arrayify(sides);
            return new EdgeProvider(poly => {
                let edges = [];
                for (let i of sides) {
                    if (wrap) {
                        i = i % poly.segments.length;
                    } else if (i >= poly.segments.length) {
                        continue;
                    }
                    edges.push(Edge.fromSegment(poly.segments[i]));
                }
                return edges;
            });
        }

        static range({step = 1, start = 0, end, wrap = false}) {
            if (step === 1 && start === 0 && end == null) {
                return new EdgeProvider(poly => {
                    return poly.segments.map(seg => Edge.fromSegment(seg));
                });
            }
            return new EdgeProvider(poly => {
                let edges = [];
                if (end == null) {
                    end = poly.segments.length - 1;
                } else if (end < 0) {
                    end = poly.segments.length - 1 - end;
                }
                if (!wrap) {
                    end = _.min([end, poly.segments.length - 1]);
                    for (let i = start; i <= end; i += step) {
                        edges.push(Edge.fromSegment(poly.segments[i]));
                    }
                } else {
                    for (let i = start; i !== end; i = (i + step) % poly.segments.length) {
                        edges.push(Edge.fromSegment(poly.segments[i]));
                    }
                }
                return edges;
            });
        }

        static stepwise(provider, {wrap = true}) {
            return new EdgeProvider(poly => {
                let edges = provider.getEdges(poly);
                if (edges.length <= 1) {
                    return [];
                }
                let secondEdges;
                if (wrap) {
                    secondEdges = _.slice(edges, 1).concat([edges[0]]);
                }
                return _.flatten(_.zip(edges, secondEdges));
            })
        }

        static of(opts) {
            if (opts == null) {
                return null;
            }
            if (opts instanceof EdgeProvider) {
                return opts;
            }
            if (_.isFunction(opts)) {
                return new EdgeProvider(opts);
            }
            if (_.isString(opts)) {
                opts = {type: opts};
            }
            opts = _.assign({type: 'range'}, opts || {});
            let type = opts.type;
            if (type == null) {
                if (opts.sides != null) {
                    type = 'sides';
                } else {
                    type = 'range';
                }
            }
            opts = _.omit(opts, ['type']);
            switch (type) {
                case 'range':
                    return EdgeProvider.range(opts);
                case 'sides':
                    return EdgeProvider.sides(opts);
                case 'stepwise':
                    let provider;
                    if (opts.provider) {
                        provider = EdgeProvider.of(opts.provider);
                        if (!provider) {
                            throw new Error('no base provider');
                        }
                    } else {
                        provider = EdgeProvider.range({});
                    }
                    return EdgeProvider.stepwise(provider, _.omit(opts, ['provider']));
                default:
                    throw new Error('unsupported type: ' + type);

            }
        }
    }

    class Generator {
        constructor(gen) {
            this._generate = gen;
        }

        generate(context, edges, attrs = new Attrs({})) {
            return this._generate(context, edges, attrs);
        }

        static regularPoly({sides = 6, flip = false}) {
            return new Generator((context, edges, attrs) => {
                return edges.map(edge => {
                    return addPolyAtCorners(edge.pt1, edge.pt2, sides, flip, attrs);
                });
            });
        }

        static lineBridge({steps = 4, flip1 = false, flip2 = false, wrap = true}) {
            return new Generator((context, edges, attrs) => {
                if (!edges.length) {
                    return [];
                }
                let bridges = [];
                for (let edgePair of _.chunk(edges, 2)) {
                    if (edgePair.length === 1) {
                        if (wrap) {
                            edgePair.push(edges[0]);
                        } else {
                            continue;
                        }
                    }
                    let bridgeLines = createLineBridgeBetweenEdges(
                        edgePair[0], edgePair[1], steps, flip1, flip2);
                    let bridge = new CompoundPath({
                        children: bridgeLines,
                        strokeColor: '#660066'
                    });
                    attrs && attrs.applyTo(bridge);
                    bridges.push(bridge);
                }
                return bridges;
            });
        }

        static of(opts) {
            if (opts == null) {
                return null;
            }
            if (opts instanceof Generator) {
                return opts;
            }
            if (_.isFunction(opts)) {
                return new Generator(opts);
            }
            if (_.isString(opts)) {
                opts = {type: opts};
            }
            opts = opts || {};
            let type = opts.type;
            if (!type && opts.sides != null) {
                type = 'poly';
            }
            opts = _.omit(opts, ['type']);
            switch (type.toLowerCase()) {
                case 'poly':
                case 'regularpoly':
                    return Generator.regularPoly(opts);
                case 'linebridge':
                case 'lines':
                    return Generator.lineBridge(opts);
                default:
                    throw new Error('Unsupported generator type: ' + type);
            }
        }
    }

    class GeoDocument {
        constructor({name = {}, meta = {}, base = {}, groups = []}) {
            this.name = name;
            this.meta = meta;
            this.base = base;
            this.groups = arrayify(groups);
        }

        render() {
            let {width, height} = paper.view.viewSize;

            let baseShapeOpts = _.cloneDeep(this.base);
            let showBaseNumbers = baseShapeOpts.showNumbers;
            if (!baseShapeOpts.center) {
                baseShapeOpts.center = [width / 2, height / 2];
            }
            if (baseShapeOpts.radius == null) {
                baseShapeOpts.radius = 0.5;
            }
            baseShapeOpts.radius *= _.min([width, height]);
            let baseShape = new Path.RegularPolygon(baseShapeOpts);
            baseShape.data.isPatternBaseShape = true;
            if (showBaseNumbers) {
                drawPolySegmentIndices(baseShape);
            }
            let allItems = [baseShape];
            let orderedItemGroups = [];
            let namedItemGroups = {};

            for (let i = 0; i < this.groups.length; i++) {
                let spec = this.groups[i];
                if (!spec) {
                    orderedItemGroups.push(null);
                    continue;
                }
                let fromId = spec.from;
                let context;
                if (fromId == null) {
                    context = baseShape;
                } else {
                    if (_.isNumber(fromId)) {
                        if (fromId < 0) {
                            fromId = i + fromId;
                        }
                        if (fromId < 0 || fromId >= i) {
                            throw new Error('Invalid source context index: ' + fromId);
                        }
                        context = orderedItemGroups[fromId];
                    } else {
                        if (!_.has(namedItemGroups, fromId)) {
                            throw new Error('Source context not found: ' + fromId);
                        }
                        context = namedItemGroups[fromId];
                    }
                }
                if (spec.attrs == null) {
                    spec.attrs = _.omit(spec, ['id', 'from', 'edges', 'generators']);
                }
                let groupItems = generateGroup(context, {
                    edges: spec.edges,
                    generators: spec.generators,
                    attrs: spec.attrs
                });
                allItems.push(...groupItems);
                orderedItemGroups.push(groupItems);
                if (spec.id) {
                    if (_.has(namedItemGroups, spec.id)) {
                        throw new Error('duplicate group id: ' + spec.id);
                    }
                    namedItemGroups[spec.id] = groupItems;
                }
            }

            return allItems;
        }

        static of(doc) {
            if (doc instanceof GeoDocument) {
                return doc;
            }
            return new GeoDocument(_.cloneDeep(doc));
        }
    }

    function createLineBridgeBetweenEdges(edge1, edge2, steps, flip1, flip2) {
        let lines = [];
        for (let i = 0; i < steps; i++) {
            let ratio = i / steps;
            let line = new Path.Line({
                from: edge1.interp(ratio, flip1),
                to: edge2.interp(ratio, flip2),
                strokeColor: '#660066',
                closed: false
            });
            lines.push(line);
        }
        return lines;
    }

    function interpPoints(pt1, pt2, ratio) {
        return new Point(
            pt1.x + (pt2.x - pt1.x) * ratio,
            pt1.y + (pt2.y - pt1.y) * ratio);
    }

    function addPolyAtCorners(pt1, pt2, numSides, flip, attrs) {
        const diff = pt2.subtract(pt1);
        const sideLength = diff.length;
        const angleStep = (360 / numSides) * (flip ? -1 : 1);
        const polyPoints = [
            pt1.clone(),
            pt2.clone()
        ];
        let pos = pt2.clone();
        let angle = diff.angle;
        for (let i = 2; i < numSides; i++) {
            angle += angleStep;
            pos.x += sideLength * Math.cos(toRadians(angle));
            pos.y += sideLength * Math.sin(toRadians(angle));
            polyPoints.push(pos.clone());
        }
        const poly = new Path(
            {
                segments: polyPoints,
                strokeColor: '#ff0000',
                closed: true
            });
        attrs && attrs.applyTo(poly);
        attrs && attrs.showNumbers && drawPolySegmentIndices(poly);
        return poly;
    }

    function drawPolySegmentIndices(poly) {
        let center = poly.bounds.center;
        for (let i = 0; i < poly.segments.length; i++) {
            let segment = poly.segments[i];
            if (!segment) {
                continue;
            }
            let prevPt = segment.previous.point;
            let currPt = segment.point;
            let textPt = averagePoints([prevPt, currPt, center]);
            textPt.x -= 6;
            textPt.y += 4;
            new PointText({
                point: textPt,
                content: i.toString(),
                fillColor: 'black',
                fontFamily: 'Courier New',
                fontSize: 12
            });
        }
    }

    function averagePoints(pts) {
        return new Point(
            _(pts).map(pt => pt.x).mean(),
            _(pts).map(pt => pt.y).mean())
    }

    function toRadians(angleDegrees) {
        return angleDegrees * Math.PI / 180;
    }

    function toDegrees(angleRadians) {
        return angleRadians * 180 / Math.PI;
    }

    function arrayify(val) {
        if (val == null) {
            return [];
        }
        if (!_.isArray(val)) {
            return [val];
        }
        return val;
    }

    Object.assign(GeoDocument.of, {
        Document: GeoDocument.of
    });

    return GeoDocument.of;
})();


