import { Component } from '@angular/core';
import { ProfileModel,Profile,Matrix } from "./model";
import { Location } from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title : string;
  advancedMode: boolean;
  model : ProfileModel;

  constructor(location:Location) {
    let path = location.prepareExternalUrl(location.path()).toLowerCase();
    this.title = "Online Voting Tool";
    this.advancedMode = true;//(path == "/advanced");
    this.model = new ProfileModel(1);
  }
}
