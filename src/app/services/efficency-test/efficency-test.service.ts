import { Injectable } from '@angular/core';
import {Http, Headers} from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class EfficencyTestService {
  url = "http://localhost:8080";

  constructor(private http : Http) {
    console.log("EfficencyTestService Init")
  }

  testLotteries(lotteries, profiles) {
    let headers = new Headers();
    headers.append("Content-Type","application/json");
    let data = {
      lotteries: lotteries,
      profile: profiles
    };

    return this.http.post(this.url+"/test",data,{headers:headers})
      .map(res => res.json());
  }
}
