import { Component, OnInit, Input,ChangeDetectorRef,ChangeDetectionStrategy } from '@angular/core';
import {toFrac} from "../frac";


/**
* Component for displaying the efficiency results of the different lotteries
*/
@Component({
  selector: 'app-efficiency-chart',
  templateUrl: './efficiency-chart.component.html',
  styleUrls: ['./efficiency-chart.component.css']
})
export class EfficiencyChartComponent implements OnInit {
  @Input() data:any;
  showInvalidMessage = false;
  visible: boolean;

  constructor() {
    this.visible = false;
  }

  ngOnInit() {}

  ngOnChanges(...args: any[]) {
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
      this.visible = false;
      return "badge-warning";
    }
    if(res.efficient) {
      this.visible = false;
      return "badge-success"
    }
    this.visible = true;
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
    if (prob[0] !== undefined) {
      // Try to use exact lotteries
      if(prob[0] !== 0) {
        let out = String.fromCharCode(index+65) +': '+ (Math.round((prob[0]/prob[1]) * 100)/100) ; // "Alternative "+
        if(prob[1] !== 1) {
          out+=" ("+ prob[0] + "/" + prob[1] +")";
        }
        else {
          out = String.fromCharCode(index+65) +': 1';
        }

        return out;
      }
    }
    else {
      // If there is no exact arithmetic dominator, then use the numerical one
      if(prob>0) {
        let out = String.fromCharCode(index+65)+': '+(Math.round(prob * 100)/100); // "Alternative "+
        let fraction = toFrac(prob);
        if(fraction.length >1) {
          out+=" ("+ fraction +")";
        }

        return out;
      }
    }
    return "";
  }

}
