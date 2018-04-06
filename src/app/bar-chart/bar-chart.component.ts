import { Component, OnInit,Input, ViewChild,SimpleChanges} from '@angular/core';
import { ChartsModule,BaseChartDirective } from "ng2-charts/ng2-charts";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit {
  @Input() data: {labels:string[],data:any[]};

  @ViewChild(BaseChartDirective) public chart: BaseChartDirective;
  barLabels : string[]
  barData : any[]

  chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutoutPercentage: 60,
    layout: {
			padding: {
				right: 40
			}
    },
    tooltips: {
      xPadding: 20,
      mode:"index",
    },
    scales: {
            xAxes: [{
                stacked: true,
                display: false,
                ticks: {
                    beginAtZero:true
                },
                maxBarThickness:100
            }],
            yAxes: [{
                stacked: true,
                display: false,
                ticks: {
                    beginAtZero:true
                },
                maxBarThickness:100
            }]
        }
  };

  constructor() {
    BaseChartDirective.defaultColors = [
    [230,23,23],
    [23,106,230],
    [23,230,106],
    [188,23,230],
    [230,147,23],
    [23,230,230],
    [64,230,23],
    [230,23,147],
    [64,23,230],
    [188,230,23]]
    //[[230,23,23],[230,147,23],[188,230,23],[64,230,23],[23,230,106],[23,230,230],[23,106,230],[64,23,230],[188,23,230],[230,23,147]]
  }

  ngOnInit() {
    this.barLabels = this.data.labels;
    this.barData   = this.data.data;
  }

  ngOnChanges(...args: any[]) {
    this.chart.datasets = this.data.data;
    this.chart.labels = this.data.labels;
    this.chart.ngOnChanges({} as SimpleChanges);
  }
}
