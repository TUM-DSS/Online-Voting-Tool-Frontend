/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { EfficencyTestService } from './efficency-test.service';

describe('EfficencyTestService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EfficencyTestService]
    });
  });

  it('should ...', inject([EfficencyTestService], (service: EfficencyTestService) => {
    expect(service).toBeTruthy();
  }));
});
