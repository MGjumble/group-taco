import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FiringTableComponent } from './firing-table.component';
import { TranslateModule } from '@ngx-translate/core';

describe('FiringTableComponent', () => {
    let component: FiringTableComponent;
    let fixture: ComponentFixture<FiringTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FiringTableComponent, TranslateModule.forRoot()],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(FiringTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
