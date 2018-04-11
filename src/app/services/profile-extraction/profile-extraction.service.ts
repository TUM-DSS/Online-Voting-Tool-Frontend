import { Injectable } from '@angular/core';
import {Http, Headers} from '@angular/http';
import 'rxjs/add/operator/map';

/**
* Service to query the server about profile extraction.
*/
@Injectable()
export class ProfileExtractionService {
  //Replace with the path to the server when deploying.
  url = "http://localhost:8080";

  constructor(private http : Http) {
    console.log("ProfileExtractionService Init")
  }

  /**
  * Requests a preference profile for a given majority matrix staircase.
  * The answer is a json object
  * {
  *   success, (boolean, true if there was no error)
  *   msg, (optional error message if success was false)
  *   profiles (the preference profile)
  * }
  *
  */
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
