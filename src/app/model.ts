/*
* Helper Classes
*/

import {Globals} from "./globals";

/**
* ProfileModel contains the preference profile and the related majority matrix
*/
export class ProfileModel {
  profiles : Profile[]
  majorityMatrix : Matrix
  majorityMatrixIsDirty : boolean
  numberOfCandidates : number
  changeRef: any
  updateListener : () => any
  setProfileStringListener : () => any
  allowStringUpdate : boolean

  constructor(size : number, private router) {
    this.numberOfCandidates = size;
    if (size === 3) {
      let CondorcetProfile = [];
      let voter1 = new Profile(3,1);
      voter1.relation = JSON.parse('[0,1,2]');
      CondorcetProfile.push(voter1);
      let voter2 = new Profile(3,1);
      voter2.relation = JSON.parse('[2,0,1]');
      CondorcetProfile.push(voter2);
      let voter3 = new Profile(3,1);
      voter3.relation = JSON.parse('[1,2,0]');
      CondorcetProfile.push(voter3);
      this.profiles = CondorcetProfile;
    }
    else {
      this.profiles = [new Profile(size,1)];
    }
    this.majorityMatrix = new Matrix(size);
    this.majorityMatrixIsDirty = false;
    this.allowStringUpdate = false;

    this.updateModel();
  }

  /**
  * Get A String of the form 2ABC-1CBA-...
  * and convert it into a profile (if valid)
  * 2: [1,2,3], 1:[2,1,0]
  * use this profile in the model
  */
  setProfileString(prof : string) {
    if(prof.length == 0) {
      return;
    }

    let profs = prof.split("-");

    let newProfiles = [];
    for (let inpString of profs) {
        inpString = inpString.toUpperCase();

        let len = -1
        if(inpString.match(/\d+[A-Z]+/)){
          let match = /(\d+)([A-Z]+)/.exec(inpString);
          let num = +match[1];
          let profString = match[2];

          if(len == -1) {
            len = profString.length;
          } else if (len != profString.length) {
            //Invalid Profile length
            return;
          }

          let profArray = [];
          for(let i = 0; i < len;i++) {
            let num = profString.charCodeAt(i)-"A".charCodeAt(0);
            if(num>=0 && num < len && profArray.indexOf(num)==-1) {
              profArray.push(num);
            } else {
              //Invalid Format
              return
            }
          }

          let p = {
            relation:profArray,
            numberOfVoters: num
          }

          newProfiles.push(p);
        } else {
          //Invalid Format
          return;
        }
    }

    this.numberOfCandidates = newProfiles[0].relation.length;
    console.log("Candidates",this.numberOfCandidates);
    if( typeof this.updateListener != "undefined" && this.updateListener!== null) {
      this.setProfileStringListener();
    }
    this.updateProfiles(newProfiles);
    this.resize(this.numberOfCandidates);
  }

  /** Add/ Remove candidates (called if the numberOfCandidates is changed)*/
  resize(newSize : number) {
    if(this.numberOfCandidates == newSize) {
      return;
    }

    //update the profile
    this.profiles.forEach(p => p.resize(newSize));

    this.numberOfCandidates = newSize;
    //Make sure that dublicate preference relations get removed/ bundeled
    this.removeDublicates();
    //Update the Matrix
    this.updateModel();
  }

  removeDublicates() {
    let pdic = {};

    for (let profile of this.profiles) {
      let relStr = profile.relation+"";
      if(! (relStr in pdic)) {
        pdic[relStr] = 0;
      }
      pdic[relStr]+=profile.numberOfVoters;
    }

    this.profiles = [];

    for (var profile in pdic) {
      if (pdic.hasOwnProperty(profile)) {
        let prof = new Profile(this.numberOfCandidates,pdic[profile]);
        prof.relation = JSON.parse('['+profile+']')
        this.profiles.push(prof);
      }
    }
  }

  /** Add an new Voter to the Profile */
  addProfile() {
    this.allowStringUpdate = true;
    this.profiles.push(new Profile(this.numberOfCandidates,1));
    this.updateModel();
  }

  /** Remove voters from the profile */
  removeProfile(index : number) {
    if (this.profiles.length>1) {
      this.profiles.splice(index,1);
      this.updateModel();
    }
  }

  /** Gets the Candidate Name (0->A , 1->B, ...) */
  getIdentifier(x:number) {
    return String.fromCharCode(x+65);
  }

  /** Called when the preference relations change */
  updateProfiles(profiles) {
    //Create new Profile objects.
    this.profiles = profiles.map(p => {
      let out = new Profile(p.relation.length,p.numberOfVoters);
      out.relation = p.relation;
      return out;
    });

    this.allowStringUpdate = true;
    this.updateModel();
  }

  getProfileString() {
    return this.profiles.reduce( (acc,val) => {
      return acc + "-" + val.numberOfVoters + val.relation.reduce((acc,val) => acc+this.getIdentifier(val),"");
    },"").slice(1);
  }

  /**
  * Updates the majority matrix and notifies the components that need to react to the change
  */
  updateModel() {
    if(this.allowStringUpdate) {
      //Update Query String
      this.router.navigate(['/'],{ queryParams: { profile:this.getProfileString()}})
    }


    //UpdateMatrix
    let mat = new Matrix(this.numberOfCandidates);

    this.profiles.forEach(p => {
      for (let i = 0; i < this.numberOfCandidates-1; i++) {
        for (let j = i+1; j < this.numberOfCandidates; j++) {
          mat.staircase[i][j-(i+1)] += p.compare(i,j);
        }
      }
    });
    this.majorityMatrix = mat;

    this.callListener();
    Globals.globalNumberOfVoters = this.getNumberOfVoters();
  }

  /** Call the update callback if one exists */
  callListener() {
    if( typeof this.updateListener != "undefined" && this.updateListener!== null) {
      this.updateListener();
    }
  }

  getNumberOfVoters() {
    var voterCount = 0;
    for (let prof of this.profiles) {
      voterCount+=prof.numberOfVoters;
    }
    return voterCount;
  }

  randomize() {
    var voterCount = this.getNumberOfVoters();

    this.profiles = Array.from(new Array(voterCount), n => this.generateRandomPreference());
    this.removeDublicates();
    this.updateModel();
  }

  generateRandomPreference() {
    var out = new Profile(this.numberOfCandidates,1);

    var pref = [];
    for(var i = 0; i < this.numberOfCandidates;i++) {
      var index = Math.floor(Math.random() * (pref.length+1));
      pref.splice(index,0,i);
    }
    out.relation = pref;
    return out;
  }
}


/**
* Represents a preference Profile
*/
export class Profile {
  relation: number[]
  numberOfVoters: number

  constructor(size : number, voters : number) {
    this.relation = Array.from(new Array(size), (x,i) => i);
    this.numberOfVoters = Math.max(1,voters);
  }

  resize(newSize : number) {
    if(newSize > this.relation.length) {
      //Append Elements
      for (let i = this.relation.length; i < newSize; i++) {
          this.relation.push(i);
      }
    }
    if(newSize < this.relation.length) {
      //Remove Elements
      this.relation = this.relation.filter(x => x < newSize);
    }
  }

  /**
  *  Returns how many voters prefer x over y if y>x then it returns a negative number
  */
  compare(x : number,y : number) {
    let p1 = this.relation.indexOf(x);
    let p2 = this.relation.indexOf(y);
    return Math.sign(p2-p1)*this.numberOfVoters;
  }
}

/**
* Represents a majority matrix
*/
export class Matrix {
  //We only store the upper triangle of the matrix (=staircase)
  /* E.g. 0  1 -3       1  -3
  *       -1 0  -1  =>     -1
  *       3  1  0
  */
  staircase: number[][]

  constructor(size : number) {
    this.staircase = [];
    for (let i = 0; i < size-1; i++) {
      this.staircase.push(new Array(size-1-i).fill(0));
    }
  }

  /**
  * Access any element of the matrix even outside the staircase
  */
  get(row : number,col : number) {

    if(row===col) {
      return 0;
    }
    if(row<col) {
      return this.staircase[row][col-(row+1)];
    }
    return -this.staircase[col][row-(col+1)];
  }
}
