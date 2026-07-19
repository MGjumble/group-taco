import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvariantsComponent } from './invariants.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

describe('InvariantsComponent', () => {
    let component: InvariantsComponent;
    let fixture: ComponentFixture<InvariantsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvariantsComponent, TranslateModule.forRoot()],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(InvariantsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
