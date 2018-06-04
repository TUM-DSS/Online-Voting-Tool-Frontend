import { Component, OnInit, Input} from '@angular/core';
import { ProfileModel,Profile,Matrix } from "../model";
import { VoteFetcherService} from "../services/vote-fetcher/vote-fetcher.service";
import { EfficencyTestService } from "../services/efficency-test/efficency-test.service"
import {ErrorBlock} from "../error-box/error-box.component"

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
  parameter?:number
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

  menues: {name:string, list:any[]}[]
  selectedMenu:number;
  selectedItem:{menu:number,item:number};

  resultDataType = ResultDataType;
  resultType : ResultDataType;
  resultProfile: number[];
  resultLotteries: number[][];
  resultBarData: BarChartData;

  showInvalidMessage : boolean;
  errorBlock: ErrorBlock;

  efficencyData : any = {success:false, msg:"No data."};
  waitSub : any[];
  waiting : boolean = false;
  socialChoiceFunctions : string[];
  socialChoiceResults: string[];

  tieWasBroken : boolean;

  constructor(private fetcher: VoteFetcherService,private tester: EfficencyTestService) {
    /**
    * The menues that will be displayed. Note Social Choice Functions are defined seperately.
    * Since they are handeled in a different way.
    */

    this.waitSub = [];
    this.socialChoiceFunctions = ["Borda","Minimax","Nanson","Black","Tideman","Essential Set"]
    this.socialChoiceResults = Array.from(new Array(this.socialChoiceFunctions.length),(x)=>"Loading");

    this.menues = [
      {
        name:"Social Choice Polytopes",
        list: [
          {
            name: "Maximal Lottery",
            hasParameter : false
          },
          {
            name: "Homogeneous Maximal Lottery",
            hasParameter : true,
            paraMin : 0,
            paraMax : 5,
            paraName: "Signed exponent"
          }
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
    }
    //Init
    this.resultType = ResultDataType.None;
    this.resultProfile = [];
    this.resultBarData = {
      labels: [],
      data: []
    }

    this.tieWasBroken = false;
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
    }

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

    this.closeInvalidMessage();
    this.tieWasBroken = false;

    let sendData:SendData  = {
      algorithm : this.menues[this.selectedItem.menu].list[this.selectedItem.item].name,
      staircase : this.model.majorityMatrix.staircase
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
    if(!this.advancedMode) {
      return;
    }

    for (let i = 0; i < this.socialChoiceFunctions.length; i++) {
        this.socialChoiceResults[i] = "Loading";
        sendData.algorithm = this.socialChoiceFunctions[i];
        this.waitSub.push(this.fetcher.getVote(sendData,100000).subscribe(data => {
          if(data.success) {
            //Update the Social Choice Function Menu
            let rMap = data.result.map(array => this.model.getIdentifier(array.findIndex(x=>x>0)));
            // let str = (rMap.length>1? "Alternatives": "Alternative")+" "+rMap;
            this.socialChoiceResults[i] = rMap;
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

        const algName = this.menues[this.selectedItem.menu].list[this.selectedItem.item].name;
        if(algName == "Maximal Lottery" && data.result.length > 1) {
          //Use Tie Breaking
          var len = data.result.length;
          var tmp = Array.from(new Array(data.result[0].length), x=>0);
          for(var i=0; i<len; i++) {
            for(var j=0; j<data.result[i].length;j++) {
              tmp[j]+=data.result[i][j];
            }
          }

          tmp = tmp.map(d => d/len);
          data.result = [tmp];
          this.tieWasBroken = true;
        }

        this.resultLotteries = data.result;
        this.resultBarData = this.getBarData(data.result);
        this.getBarData(data.result);

        //Test for efficency
        let profiles = this.model.profiles.map(p => p.relation);

        //console.log("Test Data", data.result, profiles);
        if(this.advancedMode) {
          this.tester.testLotteries(data.result,profiles).subscribe(data => this.updateEfficiencyCallback(data));
        }

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
      }
      this.resultType = ResultDataType.None;
    }
  }

  updateEfficiencyCallback(data) {
    this.efficencyData = data;
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
        label: "Alternative "+this.model.getIdentifier(i),
        data: candidateData,
        borderWidth: 3,
      });
    }

    return {
      labels: candidateLabels,
      data: outData
    }
  }
}
