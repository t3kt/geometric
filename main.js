let patterns = [
    pattern1,
    pattern2
];

function main() {
    const renderWidth = 800;
    const renderHeight = 800;

    let canvas = document.getElementById('geo-canvas');
    paper.setup(canvas);
    paper.view.viewSize.set(renderWidth, renderHeight);

    function initPatternSelector() {
        let selector = document.getElementById('pattern-selector');
        selector.innerHTML = '';
        for (let i = 0; i < patterns.length; i++) {
            let pattern = patterns[i];
            let option = document.createElement('option');
            option.textContent = pattern.name;
            option.value = i;
            selector.appendChild(option);
        }
        selector.addEventListener('change', () => {
            let val = parseInt(selector.value);
            selectPattern(val);
        });
    }
    initPatternSelector();

    function selectPattern(index) {
        paper.project.clear();
        let pattern = patterns[index];
        if (!pattern) {
            return;
        }
        let doc = Geo.Document(pattern);
        doc.render();
        paper.view.draw();
    }

    selectPattern(0);

    document.getElementById('generate-svg').addEventListener('click', evt => {
        evt.preventDefault();
        let svgText = paper.project.exportSVG({asString: true});

        let textarea = document.getElementById('geo-svg');
        textarea.textContent = svgText;
        textarea.style.display = 'block';
    });
}

window.onload = function () {
    main();
};

