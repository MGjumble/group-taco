import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutButtonComponent } from './layout-button.component';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('LayoutButtonComponent', () => {
    let component: LayoutButtonComponent;
    let fixture: ComponentFixture<LayoutButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LayoutButtonComponent, TranslateModule.forRoot()],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(LayoutButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
