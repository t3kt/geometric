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

    function generateSvg() {
        return currentPattern ? paper.project.exportSVG({asString: true}) : null;
    }

    function showOutputText(text) {
        let textarea = document.getElementById('output-text');
        textarea.textContent = text || '';
        textarea.style.display = text ? 'block' : 'none';
    }

    function showSvg() {
        let svg = generateSvg();
        showOutputText(svg);
    }

    function showJson() {
        let json = generateJson();
        showOutputText(json);
    }

    function generateJson() {
        let obj = currentPattern ? Geo.buildJsonFromPaper() : null;
        return obj ? JSON.stringify(obj, null, '\t') : null;
    }

    function performDownload(text, mimeType, ext) {
        let a = document.getElementById('download-link');
        if (!text) {
            if (a) {
                a.remove();
            }
            return;
        }
        const blob = new Blob([text], {type: mimeType});
        const e = document.createEvent('MouseEvents');

        if (!a) {
            a = document.createElement('a');
            a.id = 'download-link';
        }
        a.download = (currentPattern.name || 'pattern') + ext;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = [mimeType, a.download, a.href].join(':');
        e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    }

    function downloadSvg() {
        let svg = generateSvg();
        performDownload(svg, 'image/svg+xml', '-output.svg');
    }

    function downloadJson() {
        let json = generateJson();
        performDownload(json, 'application/json', '-output.json');
    }

    function onButtonClick(event) {
        const button = event.target;
        const action = button.id;
        switch (action) {
            case 'generate-svg':
                showSvg();
                break;
            case 'download-svg':
                downloadSvg();
                break;
            case 'generate-json':
                showJson();
                break;
            case 'download-json':
                downloadJson();
                break;
            default:
                return;
        }
        event.preventDefault();
    }

    for (let btn of document.querySelectorAll('button')) {
        btn.addEventListener('click', onButtonClick);
    }
    showOutputText(null);
}

window.onload = function () {
    main();
};

