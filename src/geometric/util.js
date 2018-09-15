"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var paper = require("paper");
var _ = require("lodash");
exports.styleFields = [
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
    return new paper.Point(_(pts).map(function (pt) { return pt.x; }).mean(), _(pts).map(function (pt) { return pt.y; }).mean());
}
exports.averagePoints = averagePoints;
function interpPoints(pt1, pt2, ratio) {
    return new paper.Point(pt1.x + (pt2.x - pt1.x) * ratio, pt1.y + (pt2.y - pt1.y) * ratio);
}
exports.interpPoints = interpPoints;
function toRadians(angleDegrees) {
    return angleDegrees * Math.PI / 180;
}
exports.toRadians = toRadians;
function toDegrees(angleRadians) {
    return angleRadians * 180 / Math.PI;
}
exports.toDegrees = toDegrees;
function arrayify(val) {
    if (val == null) {
        return [];
    }
    if (!_.isArray(val)) {
        return [val];
    }
    return val;
}
exports.arrayify = arrayify;
function cleanObj(obj) {
    if (!obj || _.isEmpty(obj)) {
        return null;
    }
    obj = _.omitBy(obj, function (val) { return _.isEmpty(val); });
    if (_.isEmpty(obj)) {
        return null;
    }
    return obj;
}
exports.cleanObj = cleanObj;
function createPolyAtCorners(paper, pt1, pt2, numSides, flip, attrs) {
    var diff = pt2.subtract(pt1);
    var sideLength = diff.length;
    var angleStep = (360 / numSides) * (flip ? -1 : 1);
    var polyPoints = [
        pt1.clone(),
        pt2.clone()
    ];
    var pos = pt2.clone();
    var angle = diff.angle;
    for (var i = 2; i < numSides; i++) {
        angle += angleStep;
        pos.x += sideLength * Math.cos(toRadians(angle));
        pos.y += sideLength * Math.sin(toRadians(angle));
        polyPoints.push(pos.clone());
    }
    var poly = new paper.Path({
        segments: polyPoints,
        strokeColor: '#ff0000',
        closed: true
    });
    attrs && attrs.applyTo(poly);
    return poly;
}
exports.createPolyAtCorners = createPolyAtCorners;
function createLineBridgeBetweenEdges(paper, edge1, edge2, steps, flip1, flip2, attrs) {
    var lines = [];
    for (var i = 0; i < steps; i++) {
        var ratio = i / steps;
        var line = new paper.Path.Line({
            from: edge1.interp(ratio, flip1),
            to: edge2.interp(ratio, flip2),
            closed: false
        });
        lines.push(line);
    }
    var group = new paper.Group({
        children: lines,
        strokeColor: '#660066'
    });
    attrs && attrs.applyTo(group);
    return group;
}
exports.createLineBridgeBetweenEdges = createLineBridgeBetweenEdges;
function drawPolySegmentIndices(paper, poly) {
    var center = poly.bounds.center;
    for (var i = 0; i < poly.segments.length; i++) {
        var segment = poly.segments[i];
        if (!segment) {
            continue;
        }
        var prevPt = segment.previous.point;
        var currPt = segment.point;
        var textPt = averagePoints([prevPt, currPt, center]);
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
exports.drawPolySegmentIndices = drawPolySegmentIndices;
function isIgnoredItem(obj, key) {
    if (key === void 0) { key = null; }
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
function stripIgnoredItems(obj) {
    if (!obj) {
        return obj;
    }
    if (_.isArray(obj)) {
        return _.filter(obj, function (item) { return !isIgnoredItem(item); });
    }
    if (_.isPlainObject(obj)) {
        return _.omitBy(obj, function (value, key) { return isIgnoredItem(value, key); });
    }
    return obj;
}
exports.stripIgnoredItems = stripIgnoredItems;
