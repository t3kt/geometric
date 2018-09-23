import {Component, Input} from '@angular/core';
import {GroupInfo} from "../../model/BuildInfoModel";

@Component({
  selector: 'build-group',
  templateUrl: './build-group.component.html',
  styleUrls: ['./build-group.component.css']
})
export class BuildGroupComponent {

  @Input()
  groupInfo: GroupInfo;

}
