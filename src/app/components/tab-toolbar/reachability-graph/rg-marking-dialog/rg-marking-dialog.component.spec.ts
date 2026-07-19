import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RgMarkingDialogComponent } from './rg-marking-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

describe('RgMarkingDialogComponent', () => {
    let component: RgMarkingDialogComponent;
    let fixture: ComponentFixture<RgMarkingDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RgMarkingDialogComponent, TranslateModule.forRoot()],
            providers: [
                { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RgMarkingDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
