import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PlayComponent } from './play.component';
import { TranslateModule } from '@ngx-translate/core';

describe('PlayComponent', () => {
    let component: PlayComponent;
    let fixture: ComponentFixture<PlayComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PlayComponent, TranslateModule.forRoot()],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
