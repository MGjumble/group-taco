import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReachabilityGraphDrawDisplayComponent } from './reachability-graph-draw-display.component';

describe('ReachabilityGraphDrawDisplayComponent', () => {
    let component: ReachabilityGraphDrawDisplayComponent;
    let fixture: ComponentFixture<ReachabilityGraphDrawDisplayComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReachabilityGraphDrawDisplayComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ReachabilityGraphDrawDisplayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
