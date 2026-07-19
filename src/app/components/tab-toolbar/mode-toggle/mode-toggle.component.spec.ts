import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModeToggleComponent } from './mode-toggle.component';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ModeToggleComponent', () => {
    let component: ModeToggleComponent;
    let fixture: ComponentFixture<ModeToggleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ModeToggleComponent, TranslateModule.forRoot()],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(ModeToggleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
