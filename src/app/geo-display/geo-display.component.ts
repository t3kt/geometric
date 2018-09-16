import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {EditorModel} from '../model/EditorModel';
import {paper, PaperScope} from 'paper';

@Component({
  selector: 'geo-display',
  templateUrl: './geo-display.component.html',
  styleUrls: ['./geo-display.component.css']
})
export class GeoDisplayComponent implements OnInit {

  @ViewChild('geoCanvas')
  canvas: ElementRef;

  private readonly _paper: PaperScope;

  constructor(private editorModel: EditorModel) {
    editorModel.changed.subscribe(() => this.render());
    this._paper = paper;
  }

  ngOnInit() {
    this._paper.setup(this.canvas.nativeElement);
    this.render();
    this.TEST_init();
  }

  TEST_init() {
    this.editorModel.parseDocument({
      "name": "pattern4",
      "base": {
        "sides": 6,
        "radius": 0.1,
        "attrs": {
          "strokeColor": "#006633",
          "strokeWidth": 3
        }
      },
      "generators": [
        {
          "id": "gen1",
          "type": "regPolyOnEdge",
          "sides": 5,
          "source": {},
          "attrs": {
            "strokeColor": "#773366",
            "strokeWidth": 5
          }
        },
        {
          "id": "gen2",
          "type": "regPolyOnEdge",
          "sides": 5,
          "source": {
            "from": "gen1",
            "start": 3,
            "end": 5
          },
          "attrs": {
            "strokeColor": "#688865",
            "strokeWidth": 2
          }
        },
        {
          "id": "bridgegen1",
          "type": "lineBridgeOnEdge",
          "steps": 4,
          "source": {
            "type": "zip",
            "source1": {
              "from": "gen1",
              "indices": [
                1,
                2
              ]
            },
            "source2": {
              "from": "gen1",
              "indices": [
                2,
                3
              ]
            }
          },
          "attrs": {
            "strokeColor": "#FF0000"
          }
        },
        {
          "_ignore": 1,
          "id": "bridgegen2",
          "type": "lineBridgeOnEdge",
          "steps": 4,
          "source": {
            "type": "zip",
            "source1": {
              "from": "gen1",
              "indices": [
                3,
                4
              ]
            },
            "source2": {
              "from": "gen2",
              "indices": [
                1,
                2
              ]
            }
          },
          "attrs": {
            "strokeColor": "#342eff"
          }
        }
      ]
    });
  }

  render() {
    this._paper.project.clear();
    const doc = this.editorModel.doc.value;
    if (!doc) {
      return;
    }
    const size = this.editorModel.size.value;
    this._paper.view.viewSize.set(size.width, size.height);
    doc.build(this._paper, size.width, size.height);
    this._paper.view.draw();
  }

}
