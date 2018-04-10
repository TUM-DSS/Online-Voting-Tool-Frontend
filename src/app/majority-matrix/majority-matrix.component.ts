import { Component, OnInit, Input,ChangeDetectorRef,ChangeDetectionStrategy} from '@angular/core';
import { ProfileExtractionService } from "../services/profile-extraction/profile-extraction.service";
import { ProfileModel,Profile,Matrix } from "../model";
import {ErrorBlock} from "../error-box/error-box.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-majority-matrix',
  templateUrl: './majority-matrix.component.html',
  styleUrls: ['./majority-matrix.component.css']
})
export class MajorityMatrixComponent implements OnInit {
  @Input() model : ProfileModel;
  editMode:boolean;
  tempStaircase: number[][];
  showInvalidMessage:boolean;
  errorBlock: ErrorBlock;

  constructor(private ref:ChangeDetectorRef, private extract:ProfileExtractionService) {
    setInterval(() => {
      this.ref.markForCheck();
    }, 500);
    this.editMode = false;
    this.showInvalidMessage = false;

    this.errorBlock = {
      title : "No Error",
      msg: "Default"
    }
  }

  ngOnInit() {
  }

  printMatrix() {
    let l = ""
    for (let i = 0; i < this.model.numberOfCandidates; i++) {
      for (let j = 0; j < this.model.numberOfCandidates; j++) {
        l+= this.model.majorityMatrix.get(i,j)+" ";
      }
      l+="\n"
    }
    console.log(l);
  }

  getCandidateArray(size : number) {
    return Array.from(new Array(size), (x,i) => i);
  }

  toggleMode() {
    if(!this.editMode) {
      this.resetEdit();
      this.editMode = true;
      this.model.majorityMatrixIsDirty = true;
    } else {
      //Check & Save
      if(!this.isValidStaircase(this.tempStaircase)) {
        // Invalid Staircase
        //console.log("Matrix Invalid");
        this.showInvalidMessage = true;
        this.errorBlock = {
          title : "Invalid Majority Matrix:",
          msg: "All non-diagonal entries must be entirely even or entirely odd."
        }

      } else {
        // Valid Staircase & Request profile
        this.extract.getProfiles(this.tempStaircase).subscribe(data => {
          if(data.success) {
            //console.log("Success");
            this.editMode = false;
            this.model.majorityMatrixIsDirty = false;
            this.model.updateProfiles(data.profiles);
          } else {
            //console.log("Fail");
            this.showInvalidMessage = true;
            this.errorBlock = {
              title : "Server Error:",
              msg: data.msg
            }
          }
        });
      }
    }
  }

  resetEdit() {
    this.tempStaircase = this.copy2D(this.model.majorityMatrix.staircase);
  }

  randomizeStaircase() {
    let bound = Math.min(Math.max(2,this.model.numberOfCandidates-1),4);
    let min = -2*bound;
    let max = 2*bound-1;
    let isEven = Math.random() < 0.5;
    this.tempStaircase = this.tempStaircase.map(arr => arr.map(entry => this.getRandomWithParity(min,max,isEven)));
    this.closeInvalidMessage();
  }

  getRandomInt(min, max) {
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
  }

  getRandomWithParity(min,max,isEven) {
    let rnd = this.getRandomInt(min,max);
    if((isEven && rnd%2 === 0)||(!isEven && rnd%2 !== 0)) {
      return rnd;
    }
    return rnd+1;
  }

  doubleStaircase() {
    this.tempStaircase = this.tempStaircase.map(arr => arr.map(entry => 2*entry));
    this.closeInvalidMessage();
  }

  closeInvalidMessage() {
    this.showInvalidMessage = false;
  }

  copy2D(arr:any[][]) {
    return arr.map(p => p.slice());
  }

  isValidStaircase(stair:number[][]) {
    let val = Math.abs(stair[0][0] % 2);
    for(let i=0;i<stair.length;i++) {
      for(let j=0;j<stair[i].length;j++) {
        if(Math.abs(stair[i][j]%2)!==val) {
          return false;
        }
      }
    }
    return true;
  }

}
