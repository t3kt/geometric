let pattern1 = Geo.Document({
    name: 'pattern1',
    base: {
        sides: 16,
        radius: 0.2,
        strokeColor: '#7e77ff'
    },
    groups: [
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
    ]
});

function main() {
    const renderWidth = 800;
    const renderHeight = 800;

    let canvas = document.getElementById('geo-canvas');
    paper.setup(canvas);
    paper.view.viewSize.set(renderWidth, renderHeight);


    pattern1.render();

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

