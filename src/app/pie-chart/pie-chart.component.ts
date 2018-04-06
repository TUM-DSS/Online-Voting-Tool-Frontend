import { Component, OnInit, Input} from '@angular/core';
import { ChartsModule } from "ng2-charts/ng2-charts";

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.css']
})
export class PieChartComponent implements OnInit {
  @Input() data;
  @Input() labels;

  chartTestData = [{
    data:[.1,.2,.5,.2],
    label:"Vote Data"
  }];

  chartOptions = {
    responsive: true
  };


  constructor() {

  }

  ngOnInit() {
  }

  packageData(data) {
    return [{
      data: data,
      label: "Vote Data"
    }];
  }

}
