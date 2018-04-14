import { Component, OnInit, Input} from '@angular/core';
import { SortablejsModule } from 'angular-sortablejs';
import { ProfileModel,Profile,Matrix } from "../model";

/**
* Component for displaying the preference profile.
*/
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

    this.model.setProfileStringListener = () => {
      this.profileOptions.numberOfCandidates = this.model.numberOfCandidates;
      this.onCandidateNumberUpdate();
    }
    this.model.resize(this.profileOptions.numberOfCandidates);
  }

  /**
  * The number of candidates has changed. Resize & Update the model.
  */
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
    this.model.allowStringUpdate = true;
    this.model.resize(this.profileOptions.numberOfCandidates);
  }

  /**
  * Helper Function for debugging. Prints the full profile.
  */
  printProfile() {
    this.model.profiles.forEach(p => console.log(p.numberOfVoters,p.relation))
  }
}

/**
* Datastructure for the options of the candidate input field.
*/
interface ProfileOptions {
  numberOfCandidates : number,
  minNumber : number,
  maxNumber : number
}
