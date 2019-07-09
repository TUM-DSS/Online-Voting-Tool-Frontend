/*
* Helper Classes
*/

import {Globals} from "./globals";
import {Input} from "@angular/core";

/**
* ProfileModel contains the preference profile and the related majority matrix
*/
export class ProfileModel {
  profiles : Profile[]
  majorityMatrix : Matrix
  majorityMatrixIsDirty : boolean
  numberOfCandidates : number
  numberOfVoters : number;
  nameOfCandidates = ["A","B","C","D","E","F","G","H","I","J"];
  componentColorOfCandidates: number[];
  changeRef: any
  updateListener : () => any
  setProfileStringListener : () => any
  allowStringUpdate : boolean;
  timer;

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
    this.componentColorOfCandidates = new Array(10);
    this.componentColorOfCandidates.fill(-1);

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

    let maximalNumberOfVoters = 1200;
    let numberOfVotersCounter = 0;
    let len = -1;

    let newProfiles = [];
    for (let inpString of profs) {
        inpString = inpString.toUpperCase();

        if(inpString.match(/\d+[A-Z]+/) && !inpString.includes(".")){
          let match = /(\d+)([A-Z]+)/.exec(inpString);
          let num = +match[1];
          let profString = match[2];

          numberOfVotersCounter += num;
          if (numberOfVotersCounter > maximalNumberOfVoters) return;
          console.log(numberOfVotersCounter);

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
          };

          newProfiles.push(p);
          // We have to reset the names of the candidates, e.g. for the case if a navigation button was pressed.
          this.nameOfCandidates = ["A","B","C","D","E","F","G","H","I","J"];
        } else if(inpString.match(/\d+[A-Z,.+ &]+/)) {
          // Try it with renamed candidates
          let match = /(\d+)([A-Z,.+ &]+)/.exec(inpString);
          if (match[1].length + match[2].length != inpString.length) {
            return;
          }
          let num = +match[1];
          let profString = match[2];

          numberOfVotersCounter += num;
          if (numberOfVotersCounter > maximalNumberOfVoters) return;

          if(len == -1) {
            len = profString.length;
          } else if (len != profString.length) {
            //Invalid Profile length
            return;
          }

          let profArray = [];
          for(let i = 0; i < len;i++) {
            let variable;
            if (profString.charCodeAt(i)==".".charCodeAt(0)) {
              i++;
              variable = profString.charCodeAt(i)-"A".charCodeAt(0);
              i++;
              i++;
              let name = "";
              while (profString.charCodeAt(i) != ".".charCodeAt(0)) {
                name += profString.charAt(i);
                i++;
              }
              this.nameOfCandidates[variable] = name;
            }
            else {
              variable = profString.charCodeAt(i)-"A".charCodeAt(0);
            }
            if(variable>=0 && variable < len && profArray.indexOf(variable)==-1) {
              profArray.push(variable);
            } else {
              //Invalid Format
              return
            }
          }

          let p = {
            relation:profArray,
            numberOfVoters: num
          };

          newProfiles.push(p);
        }
        else {
          //Invalid Format
          return;
        }
    }

    this.numberOfCandidates = newProfiles[0].relation.length;
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
    if (x === -1) {
      return "-";
    }
    // return String.fromCharCode(x+65);
    return this.nameOfCandidates[x];
  }

  /** Gets the Candidate Name (0->A , 1->B, ...) */
  getIdentifierWithPoints(x:number) {
    if (x === -1) {
      return "-";
    }
    if(String.fromCharCode(x+65) === this.nameOfCandidates[x]) {
      return this.nameOfCandidates[x];
    }
    else {
      return "."+String.fromCharCode(x+65)+"."+this.nameOfCandidates[x]+".";
    }
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
      return acc + "-" + val.numberOfVoters + val.relation.reduce((acc,val) => acc+this.getIdentifierWithPoints(val),"");
    },"").slice(1);
  }

  /**
  * Updates the model and notifies the components that need to react to the change
  */
  updateModel() {
    if(this.allowStringUpdate) {
      //Update Query String
      this.router.navigate(['/'],{ queryParams: { profile:this.getProfileString()}})
    }

    this.updateMatrix();

    this.callListener();
    // Update the total number of voters in the profile component
    this.numberOfVoters = this.getNumberOfVoters();
    this.updateComponents();
  }

  /**
   * Updates the majority matrix
   */
  updateMatrix() {
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
  }

  /** Call the update callback if one exists */
  callListener() {
    if( typeof this.updateListener != "undefined" && this.updateListener!== null) {
      this.updateListener();
    }
  }

  getNumberOfVoters() {
    let voterCount = 0;
    for (let prof of this.profiles) {
      voterCount += prof.numberOfVoters;
    }
    return voterCount;
  }

  randomize() {
    // Close minimality message and stop timeout for closing the message
    document.getElementById("minimalID").hidden = true;
    if (this.timer !== undefined) clearTimeout(this.timer);

    const voterCount = this.getNumberOfVoters();

    this.allowStringUpdate = true;
    this.profiles = Array.from(new Array(voterCount), n => this.generateRandomPreference());
    this.removeDublicates();
    this.updateModel();
  }

  randomizeWithoutCondorcet() {
    // Close minimality message and stop timeout for closing the message
    document.getElementById("minimalID").hidden = true;
    if (this.timer !== undefined) clearTimeout(this.timer);

    const voterCount = this.getNumberOfVoters();

    this.allowStringUpdate = true;
    let Condorcet = true;
    // Loop until there is no (weak) Condorcet winner
    while (Condorcet) {
      this.profiles = Array.from(new Array(voterCount), n => this.generateRandomPreference());
      this.updateMatrix();

      // Test if there is a (weak) Condorcet winner
      let potentialCondorcetWinners = new Array(this.numberOfCandidates).fill(true);

      for (let i = 0; i < this.numberOfCandidates; i++) {
        for (let j = i + 1; j < this.numberOfCandidates; j++) {
          let si = i;
          let sj = j - (i + 1);

          if (this.majorityMatrix.staircase[si][sj] > 0) {
            potentialCondorcetWinners[j] = false;
          }
          else if (this.majorityMatrix.staircase[si][sj] < 0) {
            potentialCondorcetWinners[i] = false;
          }
        }
      }
      Condorcet = false;
      for (let i = 0; i < this.numberOfCandidates; i++) {
        if (potentialCondorcetWinners[i]) {
          Condorcet = true;
        }
      }
    }

    this.removeDublicates();
    this.updateModel();
  }

  generateRandomPreference() {
    let out = new Profile(this.numberOfCandidates, 1);

    let pref = [];
    for(let i = 0; i < this.numberOfCandidates; i++) {
      const index = Math.floor(Math.random() * (pref.length + 1));
      pref.splice(index,0,i);
    }
    out.relation = pref;
    return out;
  }

  updateComponents() {
    // Flash old entries in the color array
    this.componentColorOfCandidates.fill(-1);

    // Get all alternatives which are not Pareto dominated!
    const fullMargins = this.getFullMargins(this.majorityMatrix.staircase);
    let paretoOptimalAlternatives = Array.apply(null, {length: this.numberOfCandidates}).map(Number.call, Number);
    paretoOptimalAlternatives = paretoOptimalAlternatives.filter(alternative => !fullMargins[alternative].includes(-1 * this.numberOfVoters));

    // // Just a test
    // let waString = "directed+graph+{";
    // for(let k = 0; k < this.numberOfCandidates; k++) {
    //   for(let l = k+1; l < this.numberOfCandidates; l++) {
    //     if (fullMargins[k][l] > 0) {waString += ""+k+"->"+l+",";}
    //     if (fullMargins[k][l] < 0) {waString += ""+l+"->"+k+",";}
    //   }
    // }
    // console.log(waString+"}");

    // Generate all (non-trivial, i.e. of size between 2 and m-1) subsets of these non-dominated alternatives
    let subsets = this.getAllSubsets(paretoOptimalAlternatives).filter(set => set.length > 1 && set.length < this.numberOfCandidates);
    subsets.sort(function (a, b) {
      return a.length - b.length;
    });

    // Check for component
    let elementsInFoundComponents = [];
    componentLoop:
    for(let i = 0; i < subsets.length; i++) {
      let set = subsets[i];

      // The subset to test must not intersect with another component
      for (let j = 0; j < elementsInFoundComponents.length; j++) if (set.includes(elementsInFoundComponents[j])) continue componentLoop;

      for(let k = 0; k < this.numberOfCandidates; k++) if (!set.includes(k)) {
        // All alternatives in the subset to test must have the same relation with an arbitrary alternative k outside of the set
        let referenceWeight = fullMargins[set[0]][k];
        for (let l = 0; l < set.length; l++) if (fullMargins[set[l]][k] !== referenceWeight) continue componentLoop;
      }
      // If there was no violation, the subset to test is indeed a component!
      set.sort();
      for (let l = 0; l < set.length; l++) this.componentColorOfCandidates[set[l]] = set[0];
      elementsInFoundComponents = elementsInFoundComponents.concat(set);
    }
  }

  getAllSubsets(set) {
    return set.reduce(
      (subsets, value) => subsets.concat(
        subsets.map(set => [value,...set])
      ),
      [[]]
    );
  }

  getFullMargins(stair) {
    let size = stair[0].length+1;

    let out = [];
    for (let i = 0; i < size; i++) {
      let temp = [];
      for (let j = 0; j < size; j++) {
        if(i<j) {
          temp.push(stair[i][j-(i+1)]);
        } else if(i>j) {
          temp.push(-stair[j][i-(j+1)]);
        } else {
          temp.push(0);
        }
      }
      out.push(temp);
    }
    return out;
  };
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
