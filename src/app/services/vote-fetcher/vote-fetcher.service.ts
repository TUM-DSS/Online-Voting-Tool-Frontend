import { Injectable } from '@angular/core';
import {Http, Headers} from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class VoteFetcherService {
  url = "http://localhost:8080";

  constructor(private http : Http) {
    console.log("VoteFetcherService Init")
  }

  getVote(voteData) {
    let headers = new Headers();
    headers.append("Content-Type","application/json");
    return this.http.post(this.url+"/vote",voteData,{headers:headers})
      .map(res => res.json());
  }

}
