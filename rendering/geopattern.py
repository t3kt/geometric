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

