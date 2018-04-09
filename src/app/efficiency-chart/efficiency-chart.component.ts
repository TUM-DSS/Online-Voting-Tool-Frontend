import { Component, OnInit, Input,ChangeDetectorRef,ChangeDetectionStrategy } from '@angular/core';
import {toFrac} from "../frac";

@Component({
  selector: 'app-efficiency-chart',
  templateUrl: './efficiency-chart.component.html',
  styleUrls: ['./efficiency-chart.component.css']
})
export class EfficiencyChartComponent implements OnInit {
  @Input() data:any;
  showInvalidMessage = false;

  constructor() {
  }

  ngOnInit() {}

  ngOnChanges() {
    console.log(this.data);
    this.showInvalidMessage = !this.data.success;
  }

  closeInvalidMessage() {
    this.showInvalidMessage = false;
  }

  getBadgeClass(res) {
    if(!res.success) {
      return "badge-warning";
    }
    if(res.efficient) {
      return "badge-success"
    }
    return "badge-danger";
  }

  getBadgeString(res) {
    if(!res.success) {
      return "Failed";
    }
    if(res.efficient) {
      return "Efficient"
    }
    return "Dominated";
  }

  getTooltipText(res) {
    if(!res.success) {
      return "Error: "+res.msg;
    }
    if(!res.efficient) {
      return "Dominated by: "+ res.dominator;
    }
    return "Lottery is SD Efficient.";
  }

  getDomText(prob,index) {
    if(prob>0) {
      return "Candidate "+String.fromCharCode(index+65)+': '+(Math.round(prob * 10000)/10000);//+" ("+toFrac(prob)+")";
    }
    return "";
  }

}
