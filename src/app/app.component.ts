import { Component } from '@angular/core';
import { ProfileModel,Profile,Matrix } from "./model";
import { Router, ActivatedRoute } from '@angular/router';
import { Globals} from './globals';


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
    this.advancedMode = Globals.advancedMode;
    this.title = this.advancedMode?"Online Voting Tool":"Maximal Lotteries";
    this.model = new ProfileModel(1,router); // Initialize the preference profile
  }

  ngOnInit() {
    this.paramSub = this.route.queryParams.subscribe(d => {
      if(this.paramSub) {
        this.paramSub.unsubscribe();
      }

      if(d.hasOwnProperty("profile")) {
        this.model.setProfileString(d["profile"].trim());
      }
    });
  }

  /* Open */
  static openNav() {
    // document.getElementById("myNav").style.display = "block";
    document.getElementById("infoScreen").style.width = "100%";
  }

  /* Close */
  static closeNav() {
    // document.getElementById("myNav").style.display = "none";
    document.getElementById("infoScreen").style.width = "0%";
  }
}


