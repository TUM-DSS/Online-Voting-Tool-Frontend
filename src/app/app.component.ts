import { Component, HostListener } from '@angular/core';
import { ProfileModel,Profile,Matrix } from "./model";
import { Router, ActivatedRoute } from '@angular/router';
import { Globals} from './globals';
import { Title } from '@angular/platform-browser';


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

  constructor(private router: Router, private route: ActivatedRoute, private titleService: Title ) {
    console.log(this.route.queryParams['profile']);
    this.advancedMode = Globals.advancedMode;
    this.title = this.advancedMode?"Online Voting Tool":"Maximal Lotteries";
    this.titleService.setTitle( this.title );
    this.model = new ProfileModel(3,router); // Initialize the preference profile
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
  openNav() {
    this.closeNav();
    document.getElementById("infoScreen").style.display = "block";
    // document.getElementById("infoScreen").style.width = "100%";
  }

  /* Close */
  closeNav() {
    document.getElementById("infoScreen").style.display = "none";
    document.getElementById("keyboardShortcuts").style.display = "none";
    // document.getElementById("infoScreen").style.width = "0%";
  }

  // Source: https://stackoverflow.com/a/43356977/4050546
  @HostListener('window:popstate', ['$event'])
  onPopState(event) {
    try {
      const profileString = (new URL(window.location.href)).search.split("=")[1];
      this.model.setProfileString(profileString);
    }
    catch (e) {
      // Redirect to standard profile if no valid profile string found
      this.model.setProfileString("1ABC-1CAB-1BCA");
    }

  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (Globals.globalEditMode) return;
    if (event.key === "?") {
      document.getElementById("infoScreen").style.display = "none";
      if (document.getElementById("keyboardShortcuts").style.display !== "block") document.getElementById("keyboardShortcuts").style.display = "block";
      else document.getElementById("keyboardShortcuts").style.display = "none";
    }
    if (event.key === "i") {
      this.openNav();
    }
    if (event.key === "x") {
      this.closeNav();
    }
  }
}


