import { Injectable } from '@angular/core';
import {Http, Headers} from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class ProfileExtractionService {
  url = "http://localhost:8080";

  constructor(private http : Http) {
    console.log("ProfileExtractionService Init")
  }

  getProfiles(staircase) {
    let headers = new Headers();
    headers.append("Content-Type","application/json");
    let data = {
      staircase: staircase
    };

    return this.http.post(this.url+"/extract",data,{headers:headers})
      .map(res => res.json());
  }
}
