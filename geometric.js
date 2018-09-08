const Geo = (function () {
    const {Point, Path, PointText} = paper;

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

    function generateGraph(baseShape, specs) {
        let allItems = [];
        let orderedItemGroups = [];
        let namedItemGroups = {};
        specs = arrayify(specs);

        for (let i = 0; i < specs.length; i++) {
            let spec = specs[i];
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

    class Attrs {
        constructor(opts = null) {
            opts = _.assign({
                showNumbers: false,
            }, opts || {});
            this.opts = _.omit(opts, ['showNumbers']);
            this.showNumbers = opts.showNumbers;
        }

        applyTo(item) {
            _.assign(item, this.opts);
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

        static fromSegments(segments) {
            return segments.map(seg => Edge.fromSegment(seg));
        }

        interp(ratio) {
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
                let bridgeLines = [];

                if (!edges.length) {
                    return bridgeLines;
                }

                for (let edgePair of _.chunk(edges, 2)) {
                    if (edgePair.length === 1) {
                        if (wrap) {
                            edgePair.push(edges[0]);
                        } else {
                            continue;
                        }
                    }
                    bridgeLines.push(...createLineBridgeBetweenEdges(
                        edgePair[0], edgePair[1], steps, flip1, flip2, attrs));
                }

                return bridgeLines;
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

    function createLineBridgeBetweenEdges(edge1, edge2, steps, flip1, flip2, attrs) {
        const pt1A = flip1 ? edge1.pt2 : edge1.pt1;
        const pt1B = flip1 ? edge1.pt1 : edge1.pt2;
        const pt2A = flip2 ? edge2.pt2 : edge2.pt1;
        const pt2B = flip2 ? edge2.pt1 : edge2.pt2;

        let lines = [];
        for (let i = 0; i < steps; i++) {
            let pt1 = interpPoints(pt1A, pt1B, i / steps);
            let pt2 = interpPoints(pt2A, pt2B, i / steps);
            let line = new Path.Line({
                from: pt1,
                to: pt2,
                strokeColor: '#660066',
                closed: false
            });
            attrs && attrs.applyTo(line);
            lines.push(line);
        }
        return lines;
    }

    function addLineBridgeBetweenSegments(
        segment1, segment2, numLines, flip1, flip2, attrs) {
        numLines += 2;
        let pt1A = segment1.previous.point;
        let pt1B = segment1.point;
        let pt2A = segment2.previous.point;
        let pt2B = segment2.point;
        if (flip1) {
            [pt1A, pt1B] = [pt1B, pt1A];
        }
        if (flip2) {
            [p21A, p21B] = [pt2B, pt2A];
        }

        const lines = [];
        for (let i = 1; i < numLines - 1; i++) {
            let pt1 = interpPoints(pt1A, pt1B, i / numLines);
            let pt2 = interpPoints(pt2A, pt2B, i / numLines);
            let line = new Path.Line({
                from: pt1,
                to: pt2,
                strokeColor: '#ff00ff',
                closed: false
            });
            attrs && attrs.applyTo(line);
            lines.push(line);
        }

        return lines;
    }

    function interpPoints(pt1, pt2, ratio) {
        return new Point(
            pt1.x + (pt2.x - pt1.x) * ratio,
            pt1.y + (pt2.y - pt1.y) * ratio);
    }

    function addLineBridgesBetweenAllSegments(
        poly, numLines, flip1, flip2, attrs) {
        const lines = [];
        for (let i = 0; i < poly.length; i++) {
            let segment1 = poly.segments[i];
            if (!segment1) {
                continue;
            }
            let segment2 = segment1.next;
            lines.push(...addLineBridgeBetweenSegments(
                segment1,
                segment2,
                numLines,
                flip1,
                flip2,
                attrs));
        }
        return lines;
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
            // let midPt = new Point((prevPt.x + currPt.x)/2, (prevPt.y + currPt.y)/2);
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

    function addPolyOnSegment(segment, numSides, flip, attrs) {
        let prevPt = segment.previous.point;
        let currPt = segment.point;
        return addPolyAtCorners(prevPt, currPt, numSides, flip, attrs);
    }

    function addPolyOnAllSegments(baseShape, numSides, flip, attrs) {
        return baseShape.segments.map(function (segment) {
            return addPolyOnSegment(segment, numSides, flip, attrs);
        });
    }

    function averagePoints(pts) {
        let x = 0, y = 0;
        pts.forEach(function (pt) {
            x += pt.x;
            y += pt.y;
        });
        return new Point(x / pts.length, y / pts.length);
    }

    function addPolyOnSomeSegments(baseShape, selector, numSides, flip, attrs) {
        if (Array.isArray(selector)) {
            return selector.map(function (i) {
                return addPolyOnSegment(baseShape.segments[i], numSides, flip, attrs);
            });
        }
        const polys = [];
        for (let i = selector.offset || 0;
             i !== baseShape.segments.length - 1 && (!selector.end || i < selector.end);
             i = (selector.step + i) % baseShape.segments.length) {
            polys.push(addPolyOnSegment(baseShape.segments[i], numSides, flip, attrs));
        }
        return polys;
    }

    function toRadians(angleDegrees) {
        return angleDegrees * Math.PI / 180;
    }

    function toDegrees(angleRadians) {
        return angleRadians * 360 / (2 * Math.PI);
    }

    function arrayify(val) {
        if (val == null) {
            return [];
        }
        if (!Array.isArray(val)) {
            return [val];
        }
        return val;
    }

    Object.assign(generateGraph, {
        Edge,
        Attrs,
        EdgeProvider,
        Generator,
        generateGraph,
        generate: generateGroup,
        addLineBridgeBetweenSegments,
        addLineBridgesBetweenAllSegments,
        addPolyAtCorners,
        drawPolySegmentIndices,
        addPolyOnSegment,
        addPolyOnAllSegments,
        addPolyOnSomeSegments,
    });

    return generateGraph;
})();


