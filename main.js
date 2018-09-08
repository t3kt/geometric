function main() {
    const renderWidth = 800;
    const renderHeight = 800;
    const G = Geo;

    const {Point, Size, Path} = paper;

    let centerPoint = new Point(renderWidth / 2, renderHeight / 2);

    let canvas = document.getElementById('geo-canvas');
    paper.setup(canvas);
    paper.view.viewSize.set(renderWidth, renderHeight);

    function newThing() {
        let radius = renderWidth / 6;
        let baseSides = 18;
        let baseShape = new Path.RegularPolygon(centerPoint, baseSides, radius);
        baseShape.rotate(360 / baseSides / 2);
        baseShape.strokeColor = '#7e77ff';

        G(baseShape, [
            {
                id: 'hexes',
                edges: {step: 2},
                generators: {sides: 6},
                strokeColor: '#426072'
            },
            {
                id: 'squares',
                edges: {start: 1, step: 2},
                generators: {sides: 4},
                strokeColor: '#302f72',
                strokeWidth: 2,
                // fillColor: '#426072',
                // opacity: 0.6
            },
            {
                from: 'squares',
                edges: 'stepwise',
                generators: {type: 'lineBridge', steps: 10},
                strokeColor: '#b987ff',
                opacity: 0.5,
            },
            {
                id: 'ring2',
                from: 'hexes',
                generators: {sides: 5},
                strokeColor: '#308820',
                strokeWidth: 2,
                // fillColor: '#688865',
                // opacity: 0.6
            },
            {
                from: 'ring2',
                edges: 'stepwise',
                generators: {type: 'lineBridge', steps: 10},
                strokeColor: '#584c4a',
                opacity: 0.5
            },
            {
                edges: {start: 1, step: 2},
                generators: {sides: 5, flip: true},
                strokeColor: '#584c4a'
            },
            {
                from: -1,
                edges: 'stepwise',
                generators: {type: 'lineBridge', steps: 8},
                strokeColor: '#337900'
            },
            {
                edges: 'stepwise',
                generators: {type: 'lineBridge', steps: 4},
                strokeColor: '#e079ff'
            }
        ]);
    }

    newThing();

    document.getElementById('generate-svg').addEventListener('click', evt => {
        evt.preventDefault();
        let svgText = paper.project.exportSVG({asString: true});

        let textarea = document.getElementById('geo-svg');
        textarea.textContent = svgText;
        textarea.style.display = '';
    });

    paper.view.draw();
}

window.onload = function () {
    main();
};

