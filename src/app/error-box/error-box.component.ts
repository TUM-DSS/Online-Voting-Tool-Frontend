import { Component, OnInit, Input, Output,EventEmitter } from '@angular/core';

@Component({
  selector: 'app-error-box',
  templateUrl: './error-box.component.html',
  styleUrls: ['./error-box.component.css']
})
export class ErrorBoxComponent implements OnInit {
  @Input() title;
  @Input() msg;
  @Output() close = new EventEmitter();


  constructor() { }

  ngOnInit() {
  }

}

export interface ErrorBlock {
  title: String,
  msg: String
}
