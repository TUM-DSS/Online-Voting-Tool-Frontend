import { Component, OnInit, Input} from '@angular/core';
import { SortablejsModule } from 'angular-sortablejs';
import { ProfileModel,Profile,Matrix } from "../model";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})

export class ProfileComponent implements OnInit {
  profileOptions : ProfileOptions
  @Input() model : ProfileModel
  @Input() advancedMode : boolean
  constructor() {
    this.profileOptions = {
      numberOfCandidates:4,
      minNumber:2,
      maxNumber: 6
    }
  }

  ngOnInit() {
    if(this.advancedMode) {
      this.profileOptions.maxNumber = 10;
    }

    this.model.resize(this.profileOptions.numberOfCandidates);
  }

  onCandidateNumberUpdate() {
    if(this.profileOptions.numberOfCandidates === null) {
      this.profileOptions.numberOfCandidates = 4;
    }

    if (this.profileOptions.numberOfCandidates > this.profileOptions.maxNumber) {
      this.profileOptions.numberOfCandidates = this.profileOptions.maxNumber;
    }

    if (this.profileOptions.numberOfCandidates < this.profileOptions.minNumber) {
      this.profileOptions.numberOfCandidates = this.profileOptions.minNumber;
    }
    this.model.resize(this.profileOptions.numberOfCandidates);
  }

  printProfile() {
    this.model.profiles.forEach(p => console.log(p.numberOfVoters,p.relation))
  }
}

interface ProfileOptions {
  numberOfCandidates : number,
  minNumber : number,
  maxNumber : number
}
