import { Component, OnInit, Input } from '@angular/core';

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
      onUpdate: () => this.model.updateModel(),
      draggable: '.draggable',
      animation: 100
    };
  }

  ngOnInit() {
  }

  onVoterNumberUpdate() {
    if(this.model.profiles[this.index].numberOfVoters === null ||
    this.model.profiles[this.index].numberOfVoters < 1) {
      this.model.profiles[this.index].numberOfVoters = 1;
    }
    this.model.updateModel();
  }
}
