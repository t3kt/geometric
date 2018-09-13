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

    return {
        averagePoints,
        interpPoints,
        toRadians,
        toDegrees,
        arrayify,
        cleanObj,
        createPolyAtCorners,
        styleFields
    };
})();