import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveComponent } from './save.component';
import { TranslateModule } from '@ngx-translate/core';

describe('SaveComponent', () => {
    let component: SaveComponent;
    let fixture: ComponentFixture<SaveComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SaveComponent, TranslateModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(SaveComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
