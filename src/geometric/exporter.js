const util = require('./util');
const paper = require('paper');
const _ = require('lodash');

const {cleanObj, styleFields} = util;

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

module.exports = {
    buildJsonFromPaper
};

