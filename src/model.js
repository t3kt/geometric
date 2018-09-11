Geo.model = (function () {
    const {Point, Style} = paper;
    const {util} = Geo;

    class Attrs {
        constructor(opts = null) {
            opts = opts || {};
            this.style = new Style(_.pick(opts, util.styleFields));
            this.showNumbers = opts.showNumbers;
            this.opacity = opts.opacity;
        }

        applyTo(item) {
            item.style = this.style;
            item.opacity = this.opacity;
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

    return {
        Attrs,
        Edge
    };
})();