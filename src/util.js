Geo.util = (() => {
    const styleFields = [
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
    ];

    function averagePoints(pts) {
        return new paper.Point(
            _(pts).map(pt => pt.x).mean(),
            _(pts).map(pt => pt.y).mean())
    }

    function interpPoints(pt1, pt2, ratio) {
        return new paper.Point(
            pt1.x + (pt2.x - pt1.x) * ratio,
            pt1.y + (pt2.y - pt1.y) * ratio);
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

    function cleanObj(obj) {
        if (!obj || _.isEmpty(obj)) {
            return null;
        }
        obj = _.omitBy(obj, val => _.isEmpty(val));
        if (_.isEmpty(obj)) {
            return null;
        }
        return obj;
    }

    function createPolyAtCorners(paper, pt1, pt2, numSides, flip, attrs) {
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
        const poly = new paper.Path(
            {
                segments: polyPoints,
                strokeColor: '#ff0000',
                closed: true
            });
        attrs && attrs.applyTo(poly);
        return poly;
    }

    function createLineBridgeBetweenEdges(paper, edge1, edge2, steps, flip1, flip2, attrs) {
        let lines = [];
        for (let i = 0; i < steps; i++) {
            let ratio = i / steps;
            let line = new paper.Path.Line({
                from: edge1.interp(ratio, flip1),
                to: edge2.interp(ratio, flip2),
                closed: false
            });
            lines.push(line);
        }
        let group = new paper.Group({
            children: lines,
            strokeColor: '#660066'
        });
        attrs && attrs.applyTo(group);
        return group;
    }

    function drawPolySegmentIndices(paper, poly) {
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

    return {
        averagePoints,
        interpPoints,
        toRadians,
        toDegrees,
        arrayify,
        cleanObj,
        createPolyAtCorners,
        createLineBridgeBetweenEdges,
        styleFields
    };
})();