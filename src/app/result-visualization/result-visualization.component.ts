import { Component, OnInit, Input} from '@angular/core';
import { ProfileModel,Profile,Matrix } from "../model";
import { VoteFetcherService} from "../services/vote-fetcher/vote-fetcher.service";
import { EfficencyTestService } from "../services/efficency-test/efficency-test.service"
import {ErrorBlock} from "../error-box/error-box.component"
import {barColors} from "../barColors";
import "assets/javascript-winwheel-2.7.0/Winwheel.min";
import {Globals} from "../globals";
declare var Winwheel: any;
declare var winwheelPercentToDegrees: any;
declare var createjs: any;

/**
* Types of the answers the vote server can give.
*/
enum ResultDataType {
  Lotteries, Profile, None
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
  resultBarData: BarChartData;

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
    this.secondColumn = ["Plurality","Plurality with Runoff","Instant Runoff","Anti-Plurality","Bucklin","Coombs"];
    this.thirdColumn = ["Copeland","Uncovered Set","Essential Set","Bipartisan Set"];
    // SWFs use fixed tie-breaking and are thus only displayed in the advanced mode
    if (Globals.advancedMode) {
      this.thirdColumn.push("Schulze");
      this.thirdColumn.push("Ranked Pairs");
    }
    this.forthColumn = ["Condorcet","Pareto"];
    this.socialChoiceFunctions = this.firstColumn.concat(this.secondColumn).concat(this.thirdColumn).concat(this.forthColumn);
    this.socialChoiceResults = Array.from(new Array(this.socialChoiceFunctions.length),(x)=>"Loading");
    this.socialChoiceTooltips = [];
    this.socialChoiceTooltipsActive = [];

    this.menues = [
      {
        name:"Social Decision Schemes",
        list: [
          {
            name: "Maximal lottery",
            hasParameter : true,
            paraMin : 0,
            paraMax : 5,
            paraName: "Majority margin exponent"
          },
          {
            name: "Random Dictatorship",
            hasParameter : false
          },
          {
            name: "Proportional Borda",
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
            name: "Kemeny",
            hasParameter : false
          },
          {
            name: "KemenyILP",
            hasParameter : false
          },
          {
            name: "Schulze",
            hasParameter : false
          },
          {
            name: "Ranked Pairs",
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
        'rotationAngle': 180,

        'animation' :
          { // These are the properties for the initial animation for motivating the user to spin the wheel
            'type'     : 'spinAndBack',  // Type of animation.
            'stopAngle': 185,
            // 'direction': 'anti-clockwise',
            'duration' : 2.5,             // How long the animation is to take in seconds.
            'spins'    : 0,              // The number of complete 360 degree rotations the wheel is to do.
            'repeat'   : -1,
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
    //Request the selected algorithm
    this.waitSub.push(this.fetcher.getVote(sendData).subscribe(
                                  data => this.updateVisualizationCallback(data),
                                  error=> this.updateVisualizationCallback({success:false,msg:"Server Timeout. Reload to try again."})));

    //Request all Social Choice Functions
    // if(!this.advancedMode) {
    //   return;
    // }


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
              this.socialChoiceResults[i] = this.model.getIdentifier(socialWelfareRanking[0]);
              data.tooltip = this.socialChoiceResults[i];
              for (let j = 1; j < socialWelfareRanking.length; j++) {
                data.tooltip += " > " + this.model.getIdentifier(socialWelfareRanking[j]);
              }
            }


            // (Try to) Add Tooltips
            try{
              if (data.tooltip != undefined && data.tooltip.length > 0) {
                this.socialChoiceTooltipsActive[i] = Globals.advancedMode;
                this.socialChoiceTooltips[i] = data.tooltip;

                // Adjust Condorcet SCF name to "weak" version if needed
                if(data.tooltip.includes("Weak Condorcet")) {
                  this.socialChoiceFunctions[i] = "Weak Condorcet";
                }
                else if(data.tooltip.includes("Condorcet")) {
                  this.socialChoiceFunctions[i] = "Condorcet";
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
    if(data.success) {
      this.resultType = ResultDataType.None;

      let typeTemp = +ResultDataType[data.type];
      if(typeTemp == ResultDataType.Lotteries) {
        //Lotteries

        // const algName = this.menues[this.selectedItem.menu].list[this.selectedItem.item].name;

        //Compute Tie Breaking
        const len = data.result.length;
        let tmp = Array.from(new Array(data.result[0].length), x => 0);
        for(let i=0; i<len; i++) {
            for(let j=0; j<data.result[i].length; j++) {
              tmp[j]+=data.result[i][j];
            }
          }
        tmp = tmp.map(d => d/len);
        barColors.resultLotteryForColoring = tmp;

        // Use Tie-breaking if desired
        if(this.tieBreakingActive && data.result.length > 1) {
          data.result = [tmp];
          this.tieWasBroken = true;
        }

        this.resultLotteries = data.result;
        this.resultBarData = this.getBarData(data.result);
        this.getBarData(data.result);

        if(this.tieBreakingActive) {
          this.showWheel();
        }

        //Test for efficiency
        let profiles = this.model.profiles.map(p => p.relation);

        //console.log("Test Data", data.result, profiles);
        this.tester.testLotteries(data.result,profiles).subscribe(data => this.updateEfficiencyCallback(data));

      } else {
        //Profile
        this.resultProfile = data.result;
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
        if (this.resultLotteries[0][x] > 0.001) {
          label = label.concat(this.model.getIdentifier(x) + ": " + Math.round(this.resultLotteries[0][x]*100)/100 + '<br />');
        }
      }
      return label;
    }
    catch (e) {
      return "Loading...";
    }

  }
}
