_.extend(Geo, (function () {
    const {Path, Group} = paper;
    const {averagePoints, cleanObj, arrayify, styleFields} = Geo.util;
    const {createPolyAtCorners, createLineBridgeBetweenEdges} = Geo.util;
    const {Attrs, Edge} = Geo.model;

    function generateGroup(context, {edges, generators, attrs, name}) {
        let edgeProviders = arrayify(edges || EdgeProvider.range({})).map(e => EdgeProvider.of(e));
        generators = arrayify(generators).map(g => Generator.of(g));
        attrs = Attrs.of(attrs);
        context = prepareContext(context);
        let group = new paper.Group();
        if (name) {
            group.name = name;
        }
        for (let ctx of context) {
            if (ctx == null) {
                continue;
            }
            let contextGroup = new paper.Group();
            for (let edgeProvider of edgeProviders) {
                if (edgeProvider == null) {
                    continue;
                }
                let edges = edgeProvider.getEdges(ctx);
                let edgesGroup = new paper.Group();
                for (let generator of generators) {
                    if (generator == null) {
                        continue;
                    }
                    let genItems = arrayify(generator.generate(ctx, edges, attrs));
                    if (!genItems.length) {
                        continue;
                    }
                    let genGroup = new paper.Group(genItems);
                    edgesGroup.addChild(genGroup);
                }
                if (edgesGroup.isEmpty()) {
                    edgesGroup.remove();
                } else {
                    contextGroup.addChild(edgesGroup);
                }
            }
            if (contextGroup.isEmpty()) {
                contextGroup.remove();
            } else {
                group.addChild(contextGroup);
            }
        }
        if (group.isEmpty()) {
            group.remove();
            return [];
        } else {
            return [group];
        }
    }

    function prepareContext(context) {
        const items = [];
        _addToContextList(items, context);
        return items;
    }

    function _addToContextList(output, item) {
        if (!item || _.isEmpty(item)) {
            return;
        }

        if (_.isArray(item)) {
            for (let part of item) {
                _addToContextList(output, part);
            }
        } else if (item instanceof paper.Group || item instanceof paper.Layer) {
            for (let child of item.children) {
                _addToContextList(output, child);
            }
        } else {
            output.push(item);
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

        // static zipper(provider1, provider2) {
        //     return new EdgeProvider(poly => {
        //        let edges1 = provider1.getEdges(poly)
        //     });
        // }

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
            if (_.isArray(opts)) {
                opts = {sides: opts};
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
                return new paper.Group(edges.map(edge => {
                    let poly = createPolyAtCorners(paper, edge.pt1, edge.pt2, sides, flip, attrs);
                    poly.data.generatorType = 'regularPoly';
                    poly.data.sides = sides;
                    poly.data.flip = flip;
                    return poly;
                }));
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
                    let bridge = createLineBridgeBetweenEdges(
                        paper,
                        edgePair[0], edgePair[1], steps, flip1, flip2, new Attrs({
                            strokeColor: '#660066',
                            data: {
                                generatorType: 'lineBridge',
                                steps: steps,
                                flip1: flip1,
                                flip2: flip2,
                                wrap: wrap
                            }
                        }));
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
            let baseShape = new Path.RegularPolygon(
                _.merge({
                        data: {
                            sides: baseShapeOpts.sides,
                            radius: baseShapeOpts.radius,
                            isPatternBaseShape: true,
                        }
                    },
                    baseShapeOpts));
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
                let attrs = _.merge({}, spec.attrs || {}, _.omit(spec, ['id', 'from', 'edges', 'generators']));
                let name = spec.id || ('group-' + i);
                let groupItems = generateGroup(context, {
                    edges: spec.edges,
                    generators: spec.generators,
                    attrs: attrs,
                    name: name
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

    function buildJsonFromPaper() {
        return buildJsonFromItem(paper.project);
    }

    function buildJsonFromItem(item) {
        if (item == null) {
            return null;
        }
        if (_.isNumber(item) || _.isString(item) || _.isBoolean(item)) {
            return item;
        }
        if (_.isArray(item)) {
            return _.map(item, buildJsonFromItem);
        }
        if (item instanceof paper.Color) {
            return item.components;
        }
        if (item instanceof paper.Style) {
            let obj = _(item._values).pick(styleFields).mapValues(buildJsonFromItem);
            if (_.isEmpty(obj)) {
                return null;
            }
            return obj;
        }
        if (item instanceof paper.Segment) {
            return buildJsonFromItem(item.point);
        }
        if (item instanceof paper.Point) {
            return [item.x, item.y];
        }
        let obj = {
            type: item.className,
            name: item.name,
            style: buildJsonFromItem(item.style),
            data: _.cloneDeep(item.data),
        };
        if (item instanceof paper.Path) {
            obj.points = _.map(item.segments, buildJsonFromItem);
            obj.closed = item.closed;
        } else if (item instanceof paper.Project) {
            obj.children = _.map(item.layers, buildJsonFromItem);
        } else if (item.children && item.children.length) {
            obj.children = _.map(item.children, buildJsonFromItem);
        }
        return cleanObj(obj);
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
            new paper.PointText({
                point: textPt,
                content: i.toString(),
                fillColor: 'black',
                fontFamily: 'Courier New',
                fontSize: 12
            });
        }
    }

    Object.assign(GeoDocument.of, {
        Document: GeoDocument.of,
        buildJsonFromPaper
    });

    return GeoDocument.of;
})());


