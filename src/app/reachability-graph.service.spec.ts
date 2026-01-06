import { TestBed } from '@angular/core/testing';

import { ReachabilityGraphService } from './reachability-graph.service';

describe('ReachabilityGraphService', () => {
    let service: ReachabilityGraphService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ReachabilityGraphService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
