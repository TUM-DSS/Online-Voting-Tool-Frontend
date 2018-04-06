/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ProfileExtractionService } from './profile-extraction.service';

describe('ProfileExtractionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProfileExtractionService]
    });
  });

  it('should ...', inject([ProfileExtractionService], (service: ProfileExtractionService) => {
    expect(service).toBeTruthy();
  }));
});
