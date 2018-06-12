import { Component, OnInit, Input} from '@angular/core';
import { AfterViewChecked, ElementRef, ViewChild} from '@angular/core'
import { SortablejsModule } from 'angular-sortablejs';
import { ProfileModel,Profile,Matrix } from "../model";
import { Globals} from '../globals';

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

  constructor() {
    this.profileOptions = {
      numberOfCandidates:3,
      minNumber:2,
      maxNumber: 10
    }
    this.scrollRight = true;

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

  onAddVoter() {
    this.model.addProfile();
    this.scrollRight = true;
    // Update the total number of voters
    Globals.globalNumberOfVoters = this.model.getNumberOfVoters();
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
    if (event.shiftKey && this.profileOptions.numberOfCandidates > 2) {
      this.model.randomizeWithoutCondorcet();
    } else {
      this.model.randomize();
    }
  }

  /**
   * Get number of voters
   */
  getNumberOfVoters() {
    return Globals.globalNumberOfVoters;
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
