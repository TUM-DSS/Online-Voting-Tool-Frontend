/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { VoteFetcherService } from './vote-fetcher.service';

describe('VoteFetcherService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VoteFetcherService]
    });
  });

  it('should ...', inject([VoteFetcherService], (service: VoteFetcherService) => {
    expect(service).toBeTruthy();
  }));
});
