import { Injectable } from '@angular/core';
import {Http, Headers} from '@angular/http';
import 'rxjs/add/operator/map';

/**
*  Service to query the server about different voting results.
*/
@Injectable()
export class VoteFetcherService {
  //Replace with the path to the server when deploying.
  url = "http://localhost:8080";

  constructor(private http : Http) {
    console.log("VoteFetcherService Init")
  }

  /**
  * Runs an election query.
  * As an input it takes an object:
  * {
  *   name, (the name of the voting method)
  *   parameter, (optional parameter of the voting method)
  *   staircase (the majority staircase)
  * }
  * The answer from the server is a json object
  * {
  *   success, (boolean, true if there was no error)
  *   msg, (optional error message if success was false)
  *   result (object containing an type (Lottery or Profile) and a result (the lotteries/profiles))
  * }
  *
  */
  getVote(voteData) {
    let headers = new Headers();
    headers.append("Content-Type","application/json");
    return this.http.post(this.url+"/vote",voteData,{headers:headers})
      .map(res => res.json());
  }

}
