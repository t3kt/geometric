import * as util from './util';
import * as paper from 'paper';
import * as _ from 'lodash';

export function buildJsonFromItem(item) {
  if (item == null) {
    return null;
  }
  if (_.isNumber(item) || _.isString(item) || _.isBoolean(item)) {
    return item;
  }
  if (_.isArray(item)) {
    return _.map(item, buildJsonFromItem);
  }
  if (item instanceof paper.PaperScope) {
    return buildJsonFromItem((item as paper.PaperScope).project);
  }
  if (item instanceof paper.Color) {
    return item.components;
  }
  if (item instanceof paper.Style) {
    let obj = _(item._values).pick(util.styleFields).mapValues(buildJsonFromItem);
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
    obj.children = _(item.layers).filter((layer) => layer.name != '__annotations').map(buildJsonFromItem).value();
  } else if (item.children && item.children.length) {
    obj.children = _.map(item.children, buildJsonFromItem);
  }
  return util.cleanObj(obj);
}
