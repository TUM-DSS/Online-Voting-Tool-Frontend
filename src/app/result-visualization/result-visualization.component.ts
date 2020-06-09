import {Component, Input, OnInit, HostListener} from '@angular/core';
import {Profile, ProfileModel} from "../model";
import {VoteFetcherService} from "../services/vote-fetcher/vote-fetcher.service";
import {EfficencyTestService} from "../services/efficency-test/efficency-test.service"
import {ErrorBlock} from "../error-box/error-box.component"
import {barColors} from "../barColors";
import "assets/javascript-winwheel-2.7.0/Winwheel.min";
import {Globals} from "../globals";
import {approximate} from "../frac";

declare var math: any;
declare var Winwheel: any;
declare var winwheelPercentToDegrees: any;
declare var createjs: any;

/**
* Types of the answers the vote server can give.
*/
enum ResultDataType {
  Matrices, Matrix, Lotteries, Profile, None
}

/**
* Datastructure for the Data sent to the vote server.
*/
interface SendData {
  algorithm:string,
  staircase:number[][],
  parameter?:number,
  profile: Profile[],
}

/**
* Datastructure for the visualization.
* Lables contain the names of the lotteries "Lottery 1",...
* data contains a list of object:
* {
*   label, name of the Candidate
*   data, the probability of the candidate in each lottery
*   (additional options)
* }
* Note: the Data is per candidate NOT per lottery
* so if you have lotteries [1/2,1/2,0] and [1/3,1/6,1/2] you get the objects
* {label:"Candidate 1", data [1/2,1/2]}
* {label:"Candidate 2", data [1/2,1/6]}
* {label:"Candidate 3", data [0,1/2]}
*
*/
interface BarChartData{
  labels: string[]
  data: any[]
}

/**
* Component for displaying the results of the elections
*/
@Component({
  selector: 'app-result-visualization',
  templateUrl: './result-visualization.component.html',
  styleUrls: ['./result-visualization.component.css']
})
export class ResultVisualizationComponent implements OnInit {
  @Input() model : ProfileModel;
  @Input() advancedMode: boolean;
  voteParameter : number;

  menues: {name:string, list:any[]}[];
  selectedMenu:number;
  selectedItem:{menu:number,item:number};

  resultDataType = ResultDataType;
  resultType : ResultDataType;
  resultProfile: number[];
  resultLotteries: number[][];
  exactResultLotteries: number[][][];
  resultBarData: BarChartData;
  resultCount: number;
  maximalResultCount: number;
  resultMatrix: String[][];

  showInvalidMessage : boolean;
  errorBlock: ErrorBlock;

  efficiencyData : any = {success:false, msg:"No data."};
  waitSub : any[];
  waiting : boolean = false;
  firstColumn : string[];
  secondColumn : string[];
  thirdColumn : string[];
  forthColumn : string[];
  socialChoiceFunctions : string[];
  socialChoiceResults: string[];
  socialChoiceTooltips: string[];
  socialChoiceTooltipsActive: boolean[];

  tieBreakingActive : boolean;
  tieWasBroken : boolean;
  arithmeticResult : boolean;
  visibleSCF : boolean;
  visibleSettings : boolean;
  soundActive : boolean;

  theWheel;
  static wheelWinner : string;
  static animationRunning : boolean;
  static staticSoundActive : boolean;
  // static tick;
  // static ding;
  static props;

  constructor(private fetcher: VoteFetcherService,private tester: EfficencyTestService) {
    /**
    * The menues that will be displayed. Note Social Choice Functions are defined separately.
    * Since they are handled in a different way.
    */

    this.waitSub = [];
    this.firstColumn = ["Borda","Nanson","Baldwin","Black","MaxiMin","Tideman"];
    this.secondColumn = ["Plurality","Plurality with Runoff","Instant Runoff","Anti-Plurality","Bucklin","Coombs","Young"];
    this.thirdColumn = ["Copeland","Uncovered Set","Essential Set","Bipartisan Set","Kemeny","Schulze","Ranked Pairs"];
    this.forthColumn = ["Condorcet","Pareto","Mixed Efficient","Split Cycle"];
    this.socialChoiceFunctions = this.firstColumn.concat(this.secondColumn).concat(this.thirdColumn).concat(this.forthColumn);
    this.socialChoiceResults = Array.from(new Array(this.socialChoiceFunctions.length),(x)=>"Loading");
    this.socialChoiceTooltips = [];
    this.socialChoiceTooltipsActive = [];
    this.resultCount = 0;
    this.maximalResultCount = 0;

    this.menues = [
      {
        name:"Social Decision Schemes",
        list: [
          {
            name: "Maximal Lottery",
            hasParameter : true,
            paraMin : 0,
            paraMax : 5,
            paraName: "Majority Margin Exponent"
          },
          {
            name: "Random Dictatorship",
            hasParameter : false
          },
          {
            name: "Proportional Borda",
            hasParameter : false
          },
          {
            name: "Pluri-Borda",
            hasParameter : false
          }
          // ,
          // {
          //   name: "C2-Maximal Lottery",
          //   hasParameter : false
          // }

        ]
      },
      {
        name:"Social Welfare Functions",
        list: [
          {
            name: "Kemeny Ranking",
            hasParameter : false
          },
          {
            name: "Schulze",
            hasParameter : false
          },
          {
            name: "Ranked Pairs Ranking",
            hasParameter : false
          }
        ]
      },
      {
        name:"Random Assignment",
        list: [
          {
            name: "Random Serial Dictatorship",
            hasParameter : false
          },
          {
            name: "Probabilistic Serial Rule",
            hasParameter : false
          },
          {
            name: "Popular Random Assignment",
            hasParameter : false
          }
        ]
      }
    ];

    this.selectedMenu = -1;
    this.selectedItem = {menu:0,item:0};

    this.showInvalidMessage = false;
    this.errorBlock = {
      title:"No Error:",
      msg:"Default"
    };
    //Init
    this.resultType = ResultDataType.None;
    this.resultProfile = [];
    this.resultBarData = {
      labels: [],
      data: []
    };

    this.tieBreakingActive = true;
    this.tieWasBroken = false;
    this.arithmeticResult = true;
    this.visibleSCF = Globals.advancedMode;
    this.visibleSettings = false;
    // The vote parameter is (only) the "signed exponent" at the moment. The default is hardcoded to 1 at the moment:
    this.voteParameter = 1;
    this.soundActive = true;
    ResultVisualizationComponent.wheelWinner = "none";
    ResultVisualizationComponent.animationRunning = false;
    // ResultVisualizationComponent.tick = new Audio('assets/javascript-winwheel-2.7.0/tick.mp3');
    // ResultVisualizationComponent.ding = new Audio('assets/javascript-winwheel-2.7.0/ding.mp3');

    // Make the ding less noisy
    ResultVisualizationComponent.props = new createjs.PlayPropsConfig().set({volume: 0.2});
    createjs.Sound.registerSound('assets/javascript-winwheel-2.7.0/tick.mp3',"tickID");
    createjs.Sound.registerSound('assets/javascript-winwheel-2.7.0/ding.mp3',"dingID");
  }

  get getWheelWinner() {
    return ResultVisualizationComponent.wheelWinner;
  }

  showWheel() {
    try {
      ResultVisualizationComponent.staticSoundActive = this.soundActive;

      // Setup the segments array;
      let lotterySegments = [];
      let numberOfSegmentsShown = 0;
      let monospacedFontNecessary = false;
      for (let i = 0; i < this.model.numberOfCandidates; i++) {
        if (this.resultLotteries[0][i] > 0) {
          numberOfSegmentsShown++;
          let text = this.model.getIdentifier(i);
          if (text != String.fromCharCode(i+65)) {
            monospacedFontNecessary = true;
          }
          lotterySegments.push({
            'strokeStyle' : null,
            'fillStyle': barColors.getHTMLColorWithFixedSaturation(i),
            'text': text,
            'size': winwheelPercentToDegrees(this.resultLotteries[0][i]*100)
          });
        }
      }

      this.theWheel = new Winwheel({
        'canvasId': 'wheel',
        'numSegments': numberOfSegmentsShown,
        // 'fillStyle': '#e7706f',
        'lineWidth': 0.00001, // Zero apparently does not work
        'outerRadius'   : 145,
        // 'innerRadius'   : 20,  // Set inner radius to make wheel hollow.
        'textOrientation' : 'curved',
        'textFontFamily'  : monospacedFontNecessary ? 'Courier' : "Arial",     // Monospace font best for vertical and curved.
        'textAlignment' : 'center',
        'segments': lotterySegments,
        'rotationAngle': 175,

        'animation' :
          { // These are the properties for the initial animation for motivating the user to spin the wheel
            'type'     : 'spinAndBack',  // Type of animation.
            'stopAngle': 180,
            // 'direction': 'anti-clockwise',
            'duration' : 2.5,             // How long the animation is to take in seconds.
            'spins'    : 0,              // The number of complete 360 degree rotations the wheel is to do.
            'repeat'   : 2,             // -1 for infinite loop would be nicer but takes too much energy
            'easing'       : 'Power1.easeInOut',
            // 'callbackSound' : this.playSound,
            // 'callbackFinished' : this.alertPrize,
            'yoyo': true,
          },
      });

      // Start the (small) motivating animation
      this.theWheel.startAnimation();
    } catch (e) {
      // console.log(e);
    }
    // console.log(this.theWheel);
  }

  toggleSound() {
    this.soundActive = !this.soundActive;
    ResultVisualizationComponent.staticSoundActive = this.soundActive;
  }

  playSound() {
    if(ResultVisualizationComponent.staticSoundActive) {
      // Stop and rewind the sound (stops it if already playing).
      // ResultVisualizationComponent.tick.pause();
      // ResultVisualizationComponent.tick.currentTime = 0;
      createjs.Sound.stop("tickID");

      // Play the sound.
      // ResultVisualizationComponent.tick.play();
      createjs.Sound.play("tickID");
    }
  }


  alertPrize(indicatedSegment) {
    // alert("And the winner is: " + indicatedSegment.text);
   ResultVisualizationComponent.wheelWinner = indicatedSegment.text;
   ResultVisualizationComponent.animationRunning = false;

   if (ResultVisualizationComponent.staticSoundActive) {
     // Stop and rewind the tick sound (stops it if already playing).
     // ResultVisualizationComponent.tick.pause();
     // ResultVisualizationComponent.tick.currentTime = 0;
     createjs.Sound.stop("tickID");

     // Stop and rewind the ding sound (stops it if already playing).
     // ResultVisualizationComponent.ding.pause();
     // ResultVisualizationComponent.ding.currentTime = 0;
     createjs.Sound.stop("dingID");

     // Play the sound.
     // ResultVisualizationComponent.ding.play();
     createjs.Sound.play("dingID", ResultVisualizationComponent.props);
   }
  }

  startWheelAnimation() {
    try {
      if (ResultVisualizationComponent.animationRunning) {
        this.theWheel.stopAnimation(false);
        ResultVisualizationComponent.animationRunning = false;
      }
      else if (this.theWheel === undefined || this.theWheel.canvas === null) {
        this.showWheel();
      }
      else {
        // Reset the WinWheel, i.e., remove multiples of 360 degree and the initial animation
        this.theWheel.rotationAngle = this.theWheel.getRotationPosition();
        // These are the properties for the spinning animation
        this.theWheel.stopAnimation(false);
        this.theWheel.animation = {
          'type'     : 'spinToStop',  // Type of animation.
          'duration' : 2,             // How long the animation is to take in seconds.
          'spins'    : 4,              // The number of complete 360 degree rotations the wheel is to do.
          'callbackSound' : this.playSound,
          'callbackFinished' : this.alertPrize,
        };
        this.theWheel.draw();

        // Stop and rewind the ding sound (stops it if already playing).
        // ResultVisualizationComponent.ding.pause();
        // ResultVisualizationComponent.ding.currentTime = 0;
        createjs.Sound.stop("dingID");

        // Start the animation

        this.theWheel.startAnimation();
        ResultVisualizationComponent.animationRunning = true;
        ResultVisualizationComponent.wheelWinner = "none";
      }
    }
    catch (e) {
      // console.log(e);
    }
  }

  /**
   * Show / Hide the SCF results.
   */
  toggleSCFVisibility() {
    this.visibleSCF = !this.visibleSCF;
  }

  /**
   * Show / Hide the ML settings.
   */
  toggleMLSettingsVisibility() {
    this.visibleSettings = !this.visibleSettings;
  }

  /**
   * Active / Deactivate tie-breaking
   */
  toggleTieBreaking() {
    this.tieBreakingActive = !this.tieBreakingActive;
    this.updateVisualization();
  }

  /**
   * Show exact results or approximations
   */
  toggleFormat() {
    this.arithmeticResult = !this.arithmeticResult;
    this.updateVisualization();
  }

  closeInvalidMessage() {
    this.showInvalidMessage = false;
  }

  ngOnInit() {
    //If the menu changes we want the visualization to be updated
    this.model.updateListener = () => {
      this.updateVisualization();
    };


    this.updateVisualization();
  }

  selectMenu(newIndex:number) {
    this.selectedMenu = newIndex;
  }

  toggleMenu(newIndex:number) {
    if(this.selectedMenu != newIndex) {
      this.selectedMenu = newIndex;
    } else {
      this.selectedMenu = -1;
    }
  }

  /**
  * The user selected a different algorithm form the menues.
  */
  selectAlgorithm(menuIndex:number, itemIndex:number) {
    this.selectedItem = {
      menu: menuIndex,
      item: itemIndex
    };

    if(this.menues[menuIndex].list[itemIndex].hasParameter) {
      this.voteParameter = this.menues[menuIndex].list[itemIndex].paraMin + (this.menues[menuIndex].list[itemIndex].paraMin + 1 <= this.menues[menuIndex].list[itemIndex].paraMax) ?  1 : 0;
    }

    this.selectedMenu = -1;

    this.updateVisualization();
  }

  /**
  * Something in the profile changed, request new results from the server
  */
  updateVisualization() {
    //Close old connections, Prevent data races
    for (let sub of this.waitSub) {
        sub.unsubscribe();
    }

    // Delete old winner, so the text can be hidden
    ResultVisualizationComponent.wheelWinner = "none";

    // Prevent wrong colors, e.g., if ML times out
    barColors.resultLotteryForColoring = [];
    for(let v=0; v < this.model.numberOfVoters; v++) {
      barColors.resultLotteryForColoring[v] = [];
      for(let a=0; a < this.model.numberOfCandidates; a++) {
        barColors.resultLotteryForColoring[v][a] = 0.01;
      }
    }

    this.closeInvalidMessage();
    this.tieWasBroken = false;

    let sendData:SendData  = {
      algorithm : this.menues[this.selectedItem.menu].list[this.selectedItem.item].name,
      staircase : this.model.majorityMatrix.staircase,
      profile   : this.model.profiles,
    };

    if(this.menues[this.selectedItem.menu].list[this.selectedItem.item].hasParameter) {
      sendData.parameter = this.voteParameter;
    }

    this.waiting = true;
    this.waitSub = [];
    // Request the selected algorithm
    this.waitSub.push(this.fetcher.getVote(sendData).subscribe(
                                  data => this.updateVisualizationCallback(data),
                                  error=> this.updateVisualizationCallback({success:false,msg:"Server Timeout. Reload to try again."})));

    // For correctly naming the alternatives later on
    const modelReference = this.model;
    const convertTooltipMatchToName = function (match) {
      return modelReference.getIdentifier(match.substr(12));
    };

    // Request all Social Choice Functions

    for (let i = 0; i < this.socialChoiceFunctions.length; i++) {
        this.socialChoiceResults[i] = "Loading";
        sendData.algorithm = this.socialChoiceFunctions[i];
        this.waitSub.push(this.fetcher.getVote(sendData,100000).subscribe(data => {
          if(data.success) {
            //Update the Social Choice Function results section
            if (data.type === "Lotteries") { // Classical SCF
              let rMap = data.result.map(array => this.model.getIdentifier(array.findIndex(x=>x>0)));
              // let str = (rMap.length>1? "Alternatives": "Alternative")+" "+rMap;
              this.socialChoiceResults[i] = rMap;
            }
            if (data.type === "Profile") { // SWF and we show the top-rank only
              let socialWelfareRanking = data.result;
              this.socialChoiceResults[i] = "";
              if (data.winners !== undefined) {
                for (let l = 0; l < data.winners.length; l++) this.socialChoiceResults[i]+= this.model.getIdentifier(parseInt(data.winners[l])) + ",";
                this.socialChoiceResults[i] = this.socialChoiceResults[i].slice(0, -1);
              }
              else this.socialChoiceResults[i] =  this.model.getIdentifier(socialWelfareRanking[0]);
              data.tooltip = (data.winners !== undefined && data.winners.length > 1 ? "E.g. " : "") + this.model.getIdentifier(socialWelfareRanking[0]);
              for (let j = 1; j < socialWelfareRanking.length; j++) data.tooltip += " > " + this.model.getIdentifier(socialWelfareRanking[j]);
            }


            // (Try to) Add Tooltips
            try{
              if (this.socialChoiceFunctions[i] == "Kemeny") {
                this.socialChoiceTooltipsActive[i] = true; //Globals.advancedMode;
                let socialWelfareRankings = data.tooltip;
                this.socialChoiceTooltips[i] = "";
                for (let j = 0; j < socialWelfareRankings.length; j++) {
                  let socialWelfareRanking = socialWelfareRankings[j];
                  if (socialWelfareRankings.length > 1) {
                    this.socialChoiceTooltips[i] += " Ranking "+(j+1)+": ";
                  }
                  this.socialChoiceTooltips[i] += this.model.getIdentifier(socialWelfareRanking[0]);
                  for (let k = 1; k < socialWelfareRanking.length; k++) {
                    this.socialChoiceTooltips[i] += "&nbsp;>&nbsp;" + this.model.getIdentifier(socialWelfareRanking[k]);
                  }
                  this.socialChoiceTooltips[i] +=  '<br />';
                }

              }
              else if (data.tooltip != undefined && data.tooltip.length > 0) {
                this.socialChoiceTooltipsActive[i] = true; //Globals.advancedMode;
                this.socialChoiceTooltips[i] = data.tooltip.replace(/ /g,'&nbsp;').replace(/\/n/g,'<br />').replace(/Alternative_./g, convertTooltipMatchToName);

                // Adjust Condorcet SCF name to "weak" version if needed
                if(data.tooltip.includes("Weak Condorcet")) {
                  this.socialChoiceFunctions[i] = "Weak Condorcet";
                }
                else if(data.tooltip.includes("Majority")) {
                  this.socialChoiceFunctions[i] = "Majority winner";
                }
                else if(data.tooltip.includes("Condorcet")) {
                  this.socialChoiceFunctions[i] = "Condorcet";
                }
                else if(data.tooltip.includes("Ultimate") && !data.tooltip.includes("Black")) {
                  this.socialChoiceFunctions[i] = "Ultimate Scoring winner";
                }
                else if(data.tooltip.includes("Borda") && !data.tooltip.includes("Black")) {
                  this.socialChoiceFunctions[i] = "Borda";
                }
              }
              else {
                this.socialChoiceTooltipsActive[i] = false;
              }
            }
            catch (e) {
              this.socialChoiceTooltipsActive[i] = false;
            }
          } else {
            this.socialChoiceResults[i] = "Error";
          }
        }, error => {this.socialChoiceResults[i] = "Error"}));
    }
  }

  /**
  * We got an answer from the vote server. Display them.
  */
  updateVisualizationCallback(data) {
    //console.log("Received",data)
    this.waiting = false;
    this.resultCount = 0;
    this.maximalResultCount = 0;
    const algName = this.menues[this.selectedItem.menu].list[this.selectedItem.item].name;
    if(data.success) {
      this.resultType = ResultDataType.None;

      let typeTemp = +ResultDataType[data.type];
      if(typeTemp == ResultDataType.Lotteries) { //Lotteries

        if (algName === "Random Dictatorship" || algName === "Proportional Borda") {
          this.tieBreakingActive = true;
        }

        //Compute Tie Breaking
        const numberOfLotteries = data.result.length;
        let tmp = Array.from(new Array(data.result[0].length), x => 0);
        for(let i=0; i < numberOfLotteries; i++) {
          for(let j=0; j < data.result[i].length; j++) {
            tmp[j]+=data.result[i][j];
          }
        }
        tmp = tmp.map(d => d/numberOfLotteries);
        for(let v=0; v < this.model.numberOfVoters; v++) {
          barColors.resultLotteryForColoring[v] = tmp;
        }

        let exactTemp;
        if (data.exact !== undefined) {
          exactTemp = Array.from(new Array(data.exact[0].length), x => math.fraction(0,1));
          for(let i=0; i < numberOfLotteries; i++) {
            for (let j = 0; j < data.exact[i].length; j++) {
              exactTemp[j] = exactTemp[j].add(math.fraction(data.exact[i][j][0],data.exact[i][j][1]));
            }
          }
          exactTemp = exactTemp.map(d => [math.divide(d,numberOfLotteries).n, math.divide(d,numberOfLotteries).d] );
        }
        else {
          // Fill with zero fractions
          exactTemp = Array.from(new Array(data.result[0].length), x => [0,1]);
          // Approximate the tie-breaked lottery
          for(let j=0; j < data.result[0].length; j++) {
            exactTemp[j] = approximate(tmp[j]);
          }
          // Fill with zero fractions
          data.exact = Array.from(new Array(numberOfLotteries), x => Array.from(new Array(data.result[0].length), x => [0,1]));
          // Approximate all lotteries
          for(let i=0; i < numberOfLotteries; i++) {
            for(let j=0; j < data.result[i].length; j++) {
              data.exact[i][j] = approximate(data.result[i][j]);
            }
          }
        }


        // Use Tie-breaking if desired
        if(this.tieBreakingActive && data.result.length > 1) {
          data.result = [tmp];
          data.exact = [exactTemp];
          this.tieWasBroken = true;
        }


        this.exactResultLotteries = data.exact;
        this.resultLotteries = data.result;
        this.resultBarData = this.getBarData(data.result);
        // this.getBarData(data.result);

        if(this.tieBreakingActive) {
          this.showWheel();
        }
        else {
          this.theWheel = null;
        }

        //Test for efficiency
        let voters = this.model.profiles.map(p => p.relation);

        //console.log("Test Data", data.result, profiles);
        this.tester.testLotteries(data.result, data.exact, voters).subscribe(data => this.updateEfficiencyCallback(data));

      } else if(typeTemp == ResultDataType.Profile) {
        //Profile
        this.resultProfile = data.result;
        if (data.count !== undefined && data.maximumCount !== undefined) {
          this.resultCount = data.count;
          this.maximalResultCount = data.maximumCount;
        }
      }
      else if(typeTemp == ResultDataType.Matrix) {
        this.resultMatrix = JSON.parse(JSON.stringify(data.result)); // Deep copy

        for(let i=0; i < data.result[0].length; i++) {
          for (let j = 0; j < data.result[0].length; j++) {
            let fraction = math.fraction(data.result[i][j][0], data.result[i][j][1]);
            let fractionAsString = math.format(fraction);
            if (!this.arithmeticResult) fractionAsString = data.result[i][j][0] === 0 ? 0 : (data.result[i][j][0] === data.result[i][j][1] ? 1 : (Math.round((data.result[i][j][0] / data.result[i][j][1]) * 100) / 100));
            this.resultMatrix[i][j] = data.result[i][j][0] === 0 ? 0 : ( data.result[i][j][0] === data.result[i][j][1] ? 1 : fractionAsString);
            barColors.resultLotteryForColoring[i][j] = math.number(fraction);
          }
        }

        //Test for efficiency
        let voters = this.model.profiles.map(p => p.relation);
        this.tester.testLotteries("Matrix", data.result, voters).subscribe(data => this.updateEfficiencyCallback(data));

      }

      this.resultType = typeTemp;
    } else {
      this.showInvalidMessage = true;
      this.errorBlock = {
        title:"Request Error:",
        msg: data.msg
      };
      this.resultType = ResultDataType.None;
    }
  }

  updateEfficiencyCallback(data) {
    this.efficiencyData = data;
  }

  /**
  * Transform a list of lotteries into the format of the Barchart
  */
  getBarData(lotteries:number[][]) {
    let numberOfCandidates = this.model.numberOfCandidates;

    let candidateLabels = Array.from(new Array(lotteries.length), (x,i) => "Lottery "+(i+1));
    let outData = [];

    let borderColors = Array.from(new Array(numberOfCandidates),x => "rgba(0,0,0,1)");

    for(let i = 0; i < numberOfCandidates; i++) {
      let candidateData = lotteries.map(arr => arr[i]);

      outData.push({
        label: this.model.getIdentifier(i), // "Alternative "+
        data: candidateData,
        borderWidth: 3,
      });
    }

    return {
      labels: candidateLabels,
      data: outData
    }
  }


  getLotteryForTooltip() {
    try {
      let label = "";
      for (let x = 0; x < this.model.numberOfCandidates; x++) {
        if (this.exactResultLotteries[0][x][0] !== 0) {
          let gcd = math.gcd(this.exactResultLotteries[0][x][0], this.exactResultLotteries[0][x][1]);
          let numericString = Math.round(100 * this.exactResultLotteries[0][x][0] /  this.exactResultLotteries[0][x][1])/100;
          let exactString = " (" + this.exactResultLotteries[0][x][0]/gcd + "/" + this.exactResultLotteries[0][x][1]/gcd + ")";
          label = label.concat("&nbsp;&nbsp;"+this.model.getIdentifier(x) + ": " + numericString + (this.exactResultLotteries[0][x][0] /  this.exactResultLotteries[0][x][1] != 1 ? exactString:"") + '&nbsp;&nbsp;<br />');
        }
      }
      return label;
    }
    catch (e) {
      return "Loading..."+e;
    }

  }

  /**
   * Helper Function. Generates an array of a given size where entry i is i
   */
  getCandidateArray(size : number) {
    return Array.from(new Array(size), (x,i) => i);
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (Globals.globalEditMode) return;
    if (event.key === "s") this.toggleMLSettingsVisibility();
    if (event.key === "t") document.getElementById("tieSwitch").click();
    if (event.key === "f") this.toggleSCFVisibility();
    if (event.key === "l") document.getElementById("SdsResult").hidden = !document.getElementById("SdsResult").hidden;
  }
}
