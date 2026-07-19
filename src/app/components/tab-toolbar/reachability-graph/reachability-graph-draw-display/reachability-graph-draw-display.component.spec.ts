import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReachabilityGraphDrawDisplayComponent } from './reachability-graph-draw-display.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

describe('ReachabilityGraphDrawDisplayComponent', () => {
    let component: ReachabilityGraphDrawDisplayComponent;
    let fixture: ComponentFixture<ReachabilityGraphDrawDisplayComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReachabilityGraphDrawDisplayComponent, TranslateModule.forRoot()],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(ReachabilityGraphDrawDisplayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
