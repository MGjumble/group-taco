import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReachabilityGraphDisplayComponent } from './reachability-graph-display.component';

describe('ReachabilityGraphDisplayComponent', () => {
    let component: ReachabilityGraphDisplayComponent;
    let fixture: ComponentFixture<ReachabilityGraphDisplayComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReachabilityGraphDisplayComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ReachabilityGraphDisplayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
