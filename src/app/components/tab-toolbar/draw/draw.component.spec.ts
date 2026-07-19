import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DrawComponent } from './draw.component';
import { TranslateModule } from '@ngx-translate/core';

describe('DrawComponent', () => {
    let component: DrawComponent;
    let fixture: ComponentFixture<DrawComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DrawComponent, TranslateModule.forRoot()],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(DrawComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
