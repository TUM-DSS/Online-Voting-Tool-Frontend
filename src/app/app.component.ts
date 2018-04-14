import { Component } from '@angular/core';
import { ProfileModel,Profile,Matrix } from "./model";
import { Router, ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title : string;
  advancedMode: boolean;
  model : ProfileModel;

  paramSub : any;

  constructor(private router: Router, private route: ActivatedRoute) {
    console.log(this.route.queryParams['profile']);
    this.title = "Online Voting Tool";
    this.advancedMode = true; //Set to false if only the minimal voting tool is required
    this.model = new ProfileModel(1,router); // Initialize the preference profile
  }

  ngOnInit() {
    this.paramSub = this.route.queryParams.subscribe(d => {
      if(this.paramSub) {
        this.paramSub.unsubscribe();
      }

      if(d.hasOwnProperty("profile")) {
        this.model.setProfileString(d["profile"]);
      }
    });
  }
}
