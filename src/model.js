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
            item.opacity = this.opacity;
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

    class IndexSelector {
        constructor() {
        }

        getIndices(total) {
            return _.range(total);
        }

        static of(obj) {
            //...

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
        }

        getSourcePolys(key) {
            if (!key) {
                return this.basisPoly ? [this.basisPoly] : [];
            }
            return this.polyGroupsById[key] || [];
        }
    }

    class Basis {
        constructor({id, tags = []}) {
            this.id = id;
            this.tags = tags;
        }

        build(context) {
        }
    }

    class RegularPolyBasis extends Basis {
        constructor({sides = 6, radius = 0.5, center = [0.5, 0.5], id, tags = []}) {
            super({id, tags});
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
                edgeGroups.push(_.map(indices, i => poly.segments[i]));
            }
            return edgeGroups;
        }

        static of(obj) {

        }
    }

    class EdgePairSource {
        constructor({tags = []}) {
            this.tags = tags;
        }

        getEdgePairGroups(context) {}

        static of(obj) {

        }
    }

    class ZippedEdgePairSource extends EdgePairSource {
        constructor({source1, source2, tags = []}) {
            super({tags});
            this.source1 = EdgeSource.of(source1);
            this.source2 = EdgeSource.of(source2);
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
        constructor({id, tags = []}) {
            this.id = id;
            this.tags = tags;
        }

        static of(obj) {

        }
    }

    class RegularPolyOnEdgeGenerator extends Generator {
        constructor({id, tags = [], sides = 6, flip = false, source}) {
            super({id, tags});
            this.sides = sides;
            this.flip = flip;
            this.source = EdgeSource.of(source);
        }
    }

    class LineBridgeGenerator extends Generator {
        constructor({steps = 4, flip1 = false, flip2 = false, wrap = true, id, tags = []}) {
            super({id, tags});
            this.steps = steps;
            this.flip1 = flip1;
            this.flip2 = flip2;
            this.wrap = wrap;
        }
    }

    class GeoDocument {
        constructor({name, meta = {}, base = {}, groups = []}) {
        }
    }

    return {
        Attrs,
        Edge
    };
})();