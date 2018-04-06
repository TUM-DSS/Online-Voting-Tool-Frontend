export class ProfileModel {
  profiles : Profile[]
  majorityMatrix : Matrix
  majorityMatrixIsDirty : boolean
  numberOfCandidates : number
  changeRef: any
  updateListener : () => any

  constructor(size : number) {
    this.numberOfCandidates = size;
    this.profiles = [new Profile(size,1)];
    this.majorityMatrix = new Matrix(size);
    this.majorityMatrixIsDirty = false;

    this.updateModel();
  }

  resize(newSize : number) {
    this.profiles.forEach(p => p.resize(newSize));
    //Make sure that dublicates get removed
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
        let prof = new Profile(newSize,pdic[profile]);
        prof.relation = JSON.parse('['+profile+']')
        this.profiles.push(prof);
      }
    }


    this.numberOfCandidates = newSize;
    this.updateModel();
  }

  addProfile() {
    this.profiles.push(new Profile(this.numberOfCandidates,1));
    this.updateModel();
  }

  removeProfile(index : number) {
    if (this.profiles.length>1) {
      this.profiles.splice(index,1);
      this.updateModel();
    }
  }

  getIdentifier(x:number) {
    return String.fromCharCode(x+65);
  }

  updateProfiles(profiles) {
    this.profiles = profiles.map(p => {
      let out = new Profile(p.relation.length,p.numberOfVoters);
      out.relation = p.relation;
      return out;
    });

    this.updateModel();
  }

  updateModel() {
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
  }

  callListener() {
    if( typeof this.updateListener != "undefined" && this.updateListener!== null) {
      this.updateListener();
    }
  }
}

export class Profile {
  //Represents a preference Profile
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

  compare(x : number,y : number) {
    //Returns how many voters prefer x over y if y>x then it returns a negative number
    let p1 = this.relation.indexOf(x);
    let p2 = this.relation.indexOf(y);
    return Math.sign(p2-p1)*this.numberOfVoters;
  }
}

export class Matrix {
  staircase: number[][]

  constructor(size : number) {
    this.staircase = [];
    for (let i = 0; i < size-1; i++) {
      this.staircase.push(new Array(size-1-i).fill(0));
    }
  }

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
