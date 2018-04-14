import { Component, OnInit, Input } from '@angular/core';

/**
* Component for displaying and editing a preference relation using drag and drop.
*/
@Component({
  selector: 'app-profile-box',
  templateUrl: './profile-box.component.html',
  styleUrls: ['./profile-box.component.css']
})
export class ProfileBoxComponent implements OnInit {
  @Input() model;
  @Input() index:number;
  sortableOptions:any;

  constructor() {
    this.sortableOptions = {
      onUpdate: () => {this.model.allowStringUpdate = true; this.model.updateModel();},
      draggable: '.draggable',
      animation: 100
    };
  }

  ngOnInit() {
  }

  /**
  * The number of voters has changed. -> Update the matrix
  */
  onVoterNumberUpdate() {
    if(this.model.profiles[this.index].numberOfVoters === null ||
    this.model.profiles[this.index].numberOfVoters < 1) {
      this.model.profiles[this.index].numberOfVoters = 1;
    }
    this.model.allowStringUpdate = true;
    this.model.updateModel();
  }
}
