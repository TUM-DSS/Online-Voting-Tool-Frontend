import { Component, OnInit, Input} from '@angular/core';
import { AfterViewChecked, ElementRef, ViewChild} from '@angular/core'
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
  @ViewChild('scrollContainer') private scrollContainer: ElementRef;
  scrollRight : boolean;
  visible: boolean;

  constructor() {
    this.profileOptions = {
      numberOfCandidates:3,
      minNumber:2,
      maxNumber: 10
    };
    this.scrollRight = true;
    this.visible = true;
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
   * Show / Hide the preference profile.
   */
  toggleVisibility() {
    this.visible = !this.visible;
  }


  ngAfterViewChecked() {
    //If a voter was added, scroll the profilelist fully to the right.
    if(this.scrollRight) {
      try {
        this.scrollContainer.nativeElement.scrollLeft = this.scrollContainer.nativeElement.scrollWidth;
      } catch(err) {}
      this.scrollRight = false;
    }
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
   * The number of voters in the input field has changed. Resize & Update the model.
   */
  onVoterNumberInputFieldUpdate() {
    let votersBefore = this.model.getNumberOfVoters();
    let votersAfter = this.model.numberOfVoters;

    // If there are too many voters, iteratively remove voters in the respectively last column
    while (votersAfter < votersBefore) {
      let lastVoters = this.model.profiles[this.model.profiles.length-1].numberOfVoters;
      if(lastVoters >= votersBefore - votersAfter) {
        this.model.profiles[this.model.profiles.length-1].numberOfVoters = lastVoters - votersBefore + votersAfter;
      }
      else {
        this.model.profiles.splice(this.model.profiles.length-1,1);
      }
      votersBefore = this.model.getNumberOfVoters();
    }
    // If there are too few voters replicate the last voter's preference (once)
    if (votersAfter > votersBefore) {
      let lastVoters = this.model.profiles[this.model.profiles.length-1].numberOfVoters;
      this.model.profiles[this.model.profiles.length-1].numberOfVoters = lastVoters - votersBefore + votersAfter;
    }

    this.model.allowStringUpdate = true;
    this.model.removeDublicates();
    this.model.updateModel();
  }

  onAddVoter() {
    this.model.addProfile();
    this.scrollRight = true;
  }

  /**
  * Helper Function for debugging. Prints the full profile.
  */
  printProfile() {
    this.model.profiles.forEach(p => console.log(p.numberOfVoters,p.relation))
  }

  /**
   * Generate random preferences
   */
  randomizePreferences(event) {
    if (event.shiftKey && this.profileOptions.numberOfCandidates > 2 && (this.profileOptions.numberOfCandidates != 3 || this.model.numberOfVoters != 4)) {
      this.model.randomizeWithoutCondorcet();
    } else {
      this.model.randomize();
    }
  }

  /**
   * Generate random preferences
   */
  randomizePreferencesDoubleClick() {
    if (this.profileOptions.numberOfCandidates > 2 && (this.profileOptions.numberOfCandidates != 3 || this.model.numberOfVoters != 4)) {
      this.model.randomizeWithoutCondorcet();
    } else {
      this.model.randomize();
    }
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
