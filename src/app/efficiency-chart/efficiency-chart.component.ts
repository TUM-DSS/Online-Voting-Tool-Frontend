import { Component, OnInit, Input,ChangeDetectorRef,ChangeDetectionStrategy } from '@angular/core';
import {toFrac} from "../frac";


/**
* Component for displaying the efficiency results of the diferent lotteries
*/
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
    this.showInvalidMessage = !this.data.success;
  }

  closeInvalidMessage() {
    this.showInvalidMessage = false;
  }

  /**
  * Helper function for styling the info pillss
  */
  getBadgeClass(res) {
    if(!res.success) {
      return "badge-warning";
    }
    if(res.efficient) {
      return "badge-success"
    }
    return "badge-danger";
  }

  /**
  * Helper function for text display on the info pills
  */
  getBadgeString(res) {
    if(!res.success) {
      return "Efficient"//"Failed";
    }
    if(res.efficient) {
      return "Efficient"
    }
    return "Dominated";
  }

  /**
  * Helper function for text inside the tooltip of the info pills
  */
  getTooltipText(res) {
    if(!res.success) {
      return "Lottery is probably SD Efficient (up to numerical inaccuracy)."//"Error: "+res.msg;
    }
    if(!res.efficient) {
      return "Dominated by: "+ res.dominator;
    }
    return "Lottery is SD Efficient.";
  }

  /**
  * Helper function for text inside the tooltip of the info pills
  */
  getDomText(prob,index) {
    if(prob>0) {
      let out = "Candidate "+String.fromCharCode(index+65)+': '+(Math.round(prob * 100)/100);
      let frac = toFrac(prob);
      if(frac.length >1) {
        out+=" ("+toFrac(prob)+")";
      }

      return out;
    }
    return "";
  }

}
