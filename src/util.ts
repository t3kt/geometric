import * as paper from 'paper';
import * as _ from 'lodash';

export const styleFields = [
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

export function averagePoints(pts) {
    return new paper.Point(
        _(pts).map(pt => pt.x).mean(),
        _(pts).map(pt => pt.y).mean())
}

export function interpPoints(pt1, pt2, ratio) {
    return new paper.Point(
        pt1.x + (pt2.x - pt1.x) * ratio,
        pt1.y + (pt2.y - pt1.y) * ratio);
}

export function toRadians(angleDegrees) {
    return angleDegrees * Math.PI / 180;
}

export function toDegrees(angleRadians) {
    return angleRadians * 180 / Math.PI;
}

export function arrayify(val) {
    if (val == null) {
        return [];
    }
    if (!_.isArray(val)) {
        return [val];
    }
    return val;
}

export function cleanObj(obj) {
    if (!obj || _.isEmpty(obj)) {
        return null;
    }
    obj = _.omitBy(obj, val => _.isEmpty(val));
    if (_.isEmpty(obj)) {
        return null;
    }
    return obj;
}

export function createPolyAtCorners(
    paper: paper.PaperScope,
    pt1: paper.Point,
    pt2: paper.Point,
    numSides: number,
    flip?: boolean,
    attrs?): paper.Path {
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

export function createLineBridgeBetweenEdges(
    paper: paper.PaperScope,
    edge1,
    edge2,
    steps: number,
    flip1: boolean,
    flip2: boolean,
    attrs?): paper.Group {
    const lines = [];
    for (let i = 0; i < steps; i++) {
        let ratio = i / steps;
        let line = new paper.Path.Line({
            from: edge1.interp(ratio, flip1),
            to: edge2.interp(ratio, flip2),
            closed: false
        });
        lines.push(line);
    }
    const group = new paper.Group({
        children: lines,
        strokeColor: '#660066'
    });
    attrs && attrs.applyTo(group);
    return group;
}

export function drawPolySegmentIndices(paper: paper.PaperScope, poly) {
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

function isIgnoredItem(obj, key = null) {
    if (_.isString(key) && _.startsWith(key, '_')) {
        return true;
    }
    if (_.isNil(obj)) {
        return true;
    }
    if (_.isArray(obj) && !obj.length) {
        return true;
    }
    if (_.isPlainObject(obj) && obj._ignore) {
        return true;
    }
    return false;
}

export function stripIgnoredItems(obj) {
    if (!obj) {
        return obj;
    }
    if (_.isArray(obj)) {
        return _.filter(obj, item => !isIgnoredItem(item));
    }
    if (_.isPlainObject(obj)) {
        return _.omitBy(obj, (value, key) => isIgnoredItem(value, key));
    }
    return obj;
}