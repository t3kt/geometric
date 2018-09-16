from typing import Dict

def AddRenderPatternNode(sop, obj):
	if not obj:
		return
	objtype = obj.get('type')
	data = obj.get('data') or {}
	if objtype in ['Project', 'Layer', 'Group']:
		for child in obj.get('children') or []:
			AddRenderPatternNode(sop, child)
	elif objtype == 'Path':
		_addPathNode(
			sop,
			obj,
			ispoly=data.get('generatorType') == 'regularPoly')
	else:
		pass

def _addPathNode(sop, pathnode, ispoly):
	srcpoints = pathnode.get('points')
	if not srcpoints:
		return
	n = len(srcpoints)
	if ispoly:
		n += 1
		poly = sop.appendPoly(
			n, closed=False, addPoints=True)
	else:
		poly = sop.appendPoly(
			n, closed=False, addPoints=True)
	for i, srcpoint in enumerate(srcpoints):
		poly[i].point.x = srcpoint[0]
		poly[i].point.y = srcpoint[1]
		poly[i].uv[0] = mod.tdu.remap(i, 0, n - 1, 0, 1)
	if ispoly:
		poly[n - 1].point.x = srcpoints[0][0]
		poly[n - 1].point.y = srcpoints[0][1]
		poly[n - 1].uv[0] = 1

def LoadPattern(obj, sop, polygroupsdat, polyattrsdat):
	loader = _PatternLoader(sop, polygroupsdat, polyattrsdat)
	loader.LoadPattern(obj)

class _PatternLoader:
	def __init__(self, sop, polygroupsdat, polyattrsdat):
		self.sop = sop
		self.polygroupsdat = polygroupsdat
		self.polyattrsdat = polyattrsdat
		self.polygroups = []
		self.polyattrs = []
		self.attrkeys = []

	def LoadPattern(self, rootobj):
		print('load pattern: {!r}'.format(rootobj))
		self.sop.clear()
		self.sop.vertexAttribs.create('uv')
		self.polygroupsdat.clear()
		self.polyattrsdat.clear()
		self.attrkeys = ['name', 'isBasis', 'generatorType', 'sides', 'flip']
		if rootobj:
			self._HandleNode(rootobj, [], {})
		self._BuildAttrs()
		self._BuildGroups()

	def _BuildGroups(self):
		for groups in self.polygroups:
			self.polygroupsdat.appendRow(groups or [''])

	def _BuildAttrs(self):
		self.polyattrsdat.appendRow(self.attrkeys)
		for attrs in self.polyattrs:
			i = self.polyattrsdat.numRows
			self.polyattrsdat.appendRow([''])
			for key, val in attrs.items():
				self.polyattrsdat[i, key] = val
		pass

	def _AddPolyGroups(self, poly, groups):
		if not groups:
			return
		self.polygroupsdat.appendRow(groups)

	def _AddPolyAttrs(self, poly, attrs: Dict):
		if not attrs:
			return
		self.polyattrsdat.appendRow([])
		for key, val in attrs.items():
			_addAttrToTable(self.polyattrsdat, poly.index, key, val)

	def _HandleNode(self, obj, contextgroups, contextattrs):
		print('handle node: {!r}'.format(obj))
		if not obj:
			return
		objtype = obj.get('type')
		groups = list(contextgroups)
		attrs = dict(contextattrs)
		name = obj.get('name') or attrs.get('name')
		if name:
			attrs['name'] = name
		if name and name not in groups:
			groups.append(name)
		attrs.update(obj.get('style') or {})
		attrs.update(obj.get('data') or {})
		print('  attrs: {!r}'.format(attrs))

		if objtype == 'Path':
			poly = self._AddPathPoly(
				obj,
				ispoly=attrs.get('isBasis') or attrs.get('generatorType') == 'regPolyOnEdge')
			if not poly:
				return
			self.polyattrs.append(attrs)
			self.polygroups.append(groups)
			for key in attrs.keys():
				if key not in self.attrkeys:
					self.attrkeys.append(key)
			# self._AddPolyGroups(poly, groups)
			# self._AddPolyAttrs(poly, attrs)
		elif objtype in ['Project', 'Layer', 'Group']:
			for child in obj.get('children') or []:
				self._HandleNode(child, groups, attrs)
		else:
			pass

	def _AddPathPoly(self, pathobj, ispoly):
		srcpoints = pathobj.get('points')
		if not srcpoints:
			return None
		n = len(srcpoints)
		if ispoly:
			n += 1
			poly = self.sop.appendPoly(
				n, closed=False, addPoints=True)
		else:
			poly = self.sop.appendPoly(
				n, closed=False, addPoints=True)
		for i, srcpoint in enumerate(srcpoints):
			poly[i].point.x = srcpoint[0]
			poly[i].point.y = srcpoint[1]
			poly[i].uv[0] = mod.tdu.remap(i, 0, n - 1, 0, 1)
		if ispoly:
			poly[n - 1].point.x = srcpoints[0][0]
			poly[n - 1].point.y = srcpoints[0][1]
			poly[n - 1].uv[0] = 1
		return poly


def _addAttrToTable(dat, row, key, val):
	# if key in [1, '1', '_basis', 6, '6']:
	# 	print('_addAttrToTable(row:{!r}, key:{!r}, val:{!r})'.format(row, key, val))
	# 	return
	if val is None or val is '':
		return
	# if isinstance(val, list):
	# 	for i, v in enumerate(val):
	# 		_addAttrToTable(dat, row, '{}[{}]'.format(key, i), v)
	# elif isinstance(val, dict):
	# 	# for k, v in val.items():
	# 	# 	_addAttrToTable(dat, row, '{}.{}'.format(key, k), v)
	# 	pass
	if False:
		pass
	else:
		if isinstance(val, bool):
			val = int(val)
		if dat[0, str(key)] is None:
			return
			dat.appendCol([key])
		dat[row, str(key)] = val

def _ensureSize(dat, rows, cols):
	dat.setSize(
		max(rows, dat.numRows) if rows is not None else dat.numRows,
		max(cols, dat.numCols) if cols is not None else dat.numCols)

# def _flattenObj(obj, result, prefix):
# 	if not obj:
# 		return {}
# 	for key, val in obj.items():
# 		if val is None:
# 			continue
# 		subprefix = (prefix + '.') if prefix else ''
# 		subprefix += key + '.'
# 		if isinstance(val, list):
# 			for i, v in enumerate(val):
# 				result['{}{}'.format(subprefix, i)] = v
# 		elif isinstance(val, dict):
# 			for k, v in val.items():
# 				_flattenObj()
# 				pass
# 			pass
# 		pass
# 	return result
