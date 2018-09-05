import {Component,OnInit,Input,ViewChild,ElementRef,SimpleChanges} from '@angular/core';
import { ChartsModule,BaseChartDirective } from "ng2-charts/ng2-charts";
import {Observable} from 'rxjs/Rx';
import {toFrac} from "../frac";
import {barColors} from "../barColors";

/**
* Component displaying a barchart for given barchart data
*/
@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit {
  @Input() data: {labels:string[],data:any[]};
  @Input() lotteries : number[][];
  @Input() fractions : string[][];

  @ViewChild(BaseChartDirective) public chart: BaseChartDirective;
  barLabels : string[]
  barData : any[]
  animationState = {
    goalPosition : -1,
    trigPosition : 0,
    pass : 0,
    running : false
  }
  electionWinner: string[] = [];

  @ViewChild('chartRef')
  chartRef: ElementRef;

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,//true,
    cutoutPercentage: 60,
    layout: {
			padding: {
				right: 40,
        bottom: 40
			}
    },

    legend: {
      position:"bottom"
    },
    tooltips: {
      xPadding: 20,
      callbacks: {
                // Set a custom label function to change the text of the barchart tooltips
                label: function(tooltipItem, data) {
                  let label = data.datasets[tooltipItem.datasetIndex].label || '';
                  let rounded = Math.round(tooltipItem.xLabel * 100) / 100;

                    if (label) {
                        label += ': ';
                    }
                    label += rounded;
                    let frac = toFrac(tooltipItem.xLabel);
                    if(frac.length>1) {
                      label += " ("+frac+ ")";
                    }
                    return rounded === 0 ? null : label;
                }
            }
      //mode:"index",
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
    //Change the bar colors
    BaseChartDirective.defaultColors = barColors.defaultColors;
  }

  updateSub : any;

  ngOnInit() {
    this.barLabels = this.data.labels;
    this.barData   = this.data.data;

    let updateTimer = Observable.timer(2000,10);
    this.updateSub = updateTimer.subscribe(() => this.updateElection());
  }

  ngOnChanges(...args: any[]) {
    this.chart.datasets = this.data.data;
    this.chart.labels = this.data.labels;
    this.chart.ngOnChanges({} as SimpleChanges);
  }

  ngOnDestroy() {
    this.updateSub.unsubscribe();
  }

  /**
  * Start the animation of the lottery process
  */
  runElection() {
    this.animationState.trigPosition = 0;
    this.animationState.goalPosition  = Math.random();
    this.animationState.pass = 0;
    this.animationState.running = true;
    this.electionWinner = [];
  }

  /**
  * Draw/Update the animation of the lottery process
  */
  updateElection() {
    if(!this.animationState.running){
      return;
    }

    let canvasElement = this.chartRef.nativeElement;
    let ctx: CanvasRenderingContext2D = this.chartRef.nativeElement.getContext("2d");
    const computedStyles = getComputedStyle(canvasElement);
    const trueWidth = +computedStyles.width.replace("px","");
    const trueHeight = +computedStyles.height.replace("px","");
    canvasElement.width = trueWidth;
    canvasElement.height = trueHeight;
    const cWidth = canvasElement.width;
    const cHeight = canvasElement.height;

    const barWidth = cWidth - 40;
    ctx.clearRect(0,0,cWidth,cHeight);

    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo( (this.animationState.trigPosition*barWidth -20), 45);
    ctx.lineTo( (this.animationState.trigPosition*barWidth    ), 5 );
    ctx.lineTo( (this.animationState.trigPosition*barWidth +20), 45);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();


    let sign = this.animationState.pass%2 == 0? 1 : -1;
    this.animationState.trigPosition += sign*0.01;

    if(this.animationState.pass === 2) {
      if (this.animationState.trigPosition >= this.animationState.goalPosition) {
        this.animationState.trigPosition = this.animationState.goalPosition;
        //DONE
        this.animationState.running = false;
        this.updateElectionWinner();
      }
    } else {
      //Switch direction
      if(this.animationState.trigPosition>=1) {
        this.animationState.trigPosition = 1;
        this.animationState.pass++;
      }

      if(this.animationState.trigPosition<=0) {
        this.animationState.trigPosition = 0;
        this.animationState.pass++;
      }
    }
  }

  /**
  * Update the winner of the lottery process
  */
  updateElectionWinner() {
    let winner:number[] = [];
    for (let lottery of this.lotteries) {
      let sum = 0;
      let done = false;
      for (let i = 0; i < lottery.length; i++) {
          sum+=lottery[i];
          if(sum>=this.animationState.goalPosition) {
            winner.push(i);
            done = true;
            break;
          }
      }
      if(!done) {
        winner.push(lottery.length-1);
      }
    }
    this.electionWinner = winner.map((x,i)=> "Lottery "+(i+1)+": Alternative "+String.fromCharCode(x+65));
  }
}
