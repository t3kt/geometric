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

    let currentPattern;

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
        currentPattern = patterns[index];
        if (!currentPattern) {
            return;
        }
        let doc = Geo.Document(currentPattern);
        doc.render();
        paper.view.draw();
    }

    selectPattern(0);

    function generateSVG() {
        return paper.project.exportSVG({asString: true});
    }

    function showSVG() {
        if (!currentPattern) {
            return;
        }
        let svg = generateSVG();
        let textarea = document.getElementById('geo-svg');
        textarea.textContent = svg;
        textarea.style.display = 'block';
    }

    function downloadSVG() {
        let a = document.getElementById('download-link');
        if (!currentPattern) {
            if (a) {
                a.remove();
            }
            return;
        }
        // image/svg+xml
        const svg = generateSVG();
        const blob = new Blob([svg], {type: 'image/svg+xml'});
        const e = document.createEvent('MouseEvents');

        if (!a) {
            a = document.createElement('a');
            a.id = 'download-link';
        }
        a.download = (currentPattern.name || 'pattern') + '.svg';
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['image/svg+xml', a.download, a.href].join(':');
        e.initEvent('click', true, false);
        a.dispatchEvent(e);
    }


    document.getElementById('generate-svg').addEventListener('click', evt => {
        evt.preventDefault();
        showSVG();
    });

    document.getElementById('download-svg').addEventListener('click', evt => {
        evt.preventDefault();
        downloadSVG();
    });
}

window.onload = function () {
    main();
};

