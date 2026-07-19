import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ReachabilityGraphComponent } from './reachability-graph.component';
import { TranslateModule } from '@ngx-translate/core';

describe('ReachabilityGraphComponent', () => {
    let component: ReachabilityGraphComponent;
    let fixture: ComponentFixture<ReachabilityGraphComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReachabilityGraphComponent, TranslateModule.forRoot()],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(ReachabilityGraphComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
