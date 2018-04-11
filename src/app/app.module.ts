import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import 'rxjs/add/operator/map';
import { RouterModule,Routes } from '@angular/router';
import { Location } from '@angular/common';

import { AppComponent } from './app.component';
import { SortablejsModule } from 'angular-sortablejs';
import { ProfileBoxComponent } from './profile-box/profile-box.component';
import { MajorityMatrixComponent } from './majority-matrix/majority-matrix.component';
import { ProfileComponent } from './profile/profile.component';
import { ResultVisualizationComponent } from './result-visualization/result-visualization.component';

import { ProfileExtractionService } from "./services/profile-extraction/profile-extraction.service";
import { VoteFetcherService } from "./services/vote-fetcher/vote-fetcher.service";
import { EfficencyTestService } from "./services/efficency-test/efficency-test.service";

import { ErrorBoxComponent } from './error-box/error-box.component';

import { ChartsModule } from "ng2-charts/ng2-charts";
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { EfficiencyChartComponent } from './efficiency-chart/efficiency-chart.component';

//It's a single page application so everything redirects to /
const appRoutes : Routes = [
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    ProfileBoxComponent,
    MajorityMatrixComponent,
    ProfileComponent,
    ResultVisualizationComponent,
    ErrorBoxComponent,
    BarChartComponent,
    EfficiencyChartComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    SortablejsModule,
    ChartsModule,
    RouterModule.forRoot(appRoutes)
  ],
  exports: [ RouterModule ],
  providers: [ProfileExtractionService, VoteFetcherService, EfficencyTestService],
  bootstrap: [AppComponent]
})
export class AppModule { }
