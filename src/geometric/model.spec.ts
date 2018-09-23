import {IndexRangeSelector} from "./model";

describe('IndexRangeSelector', () => {
  it('should generate full list', () => {
    let selector = new IndexRangeSelector({
      start: 0,
      end: null,
      step: 1,
      wrap: false,
    });
    expect(selector.getIndices(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7,]);
  });
  it('should generate list with even step', () => {
    let selector = new IndexRangeSelector({
      start: 0,
      end: null,
      step: 2,
      wrap: false,
    });
    expect(selector.getIndices(8)).toEqual([0, 2, 4, 6,]);
  });
  it('should generate list with start offset and even step', () => {
    let selector = new IndexRangeSelector({
      start: 1,
      end: null,
      step: 2,
      wrap: false,
    });
    expect(selector.getIndices(8)).toEqual([1, 3, 5, 7,]);
  });
  it('should generate list with start offset, wrapping and single step', () => {
    let selector = new IndexRangeSelector({
      start: 3,
      end: null,
      step: 1,
      wrap: true,
    });
    expect(selector.getIndices(8)).toEqual([3, 4, 5, 6, 7, 0, 1, 2,]);
  });
  it('should generate list with start offset, wrapping and step of 2', () => {
    let selector = new IndexRangeSelector({
      start: 3,
      end: null,
      step: 2,
      wrap: true,
    });
    expect(selector.getIndices(8)).toEqual([3, 5, 7, 1,]);
  });
  it('should generate list with wrapping and step of 3', () => {
    let selector = new IndexRangeSelector({
      start: 0,
      end: null,
      step: 3,
      wrap: true,
    });
    expect(selector.getIndices(8)).toEqual([0, 3, 6, 1, 4, 7, 2, 5,]);
  });
});
