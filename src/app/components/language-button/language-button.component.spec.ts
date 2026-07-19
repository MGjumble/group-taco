import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageButtonComponent } from './language-button.component';
import { TranslateModule } from '@ngx-translate/core';

describe('LanguageButtonComponent', () => {
    let component: LanguageButtonComponent;
    let fixture: ComponentFixture<LanguageButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LanguageButtonComponent, TranslateModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(LanguageButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
