import { Injectable } from '@angular/core';
import {Http, Headers} from '@angular/http';
import 'rxjs/add/operator/map';

/**
* Service to query the server about SD & PC efficiency.
*/
@Injectable()
export class EfficencyTestService {
  //Replace with the path to the server when deploying.
  url = "http://localhost:8080";

  constructor(private http : Http) {
    console.log("EfficencyTestService Init")
  }

  /**
  * Checks if a given list of lotteries is (SD & PC) efficient given the preference profile.
  *
  * The answer is a json object
  * {
  *   success,  (boolean, true if there was no error)
  *   msg,      (optional error message if success was false)
  *   sdresult  (list of efficiency objects)
  *   pcresult  (list of efficiency objects)
  * }
  *
  * An efficency object:
  * {
  *   success, (boolean, true if there was no error)
  *   msg,     (optional error message if success was false)
  *   efficent,(boolean, true if the lottery is efficent)
  *   dominator(optional lottery dominating the given lottery if not efficient)
  * }
  *
  */
  testLotteries(lotteries, exact, profiles) {
    let headers = new Headers();
    headers.append("Content-Type","application/json");
    let data = {
      lotteries: lotteries,
      exact: exact,
      profile: profiles
    };

    return this.http.post(this.url+"/test",data,{headers:headers})
      .map(res => res.json());
  }
}
