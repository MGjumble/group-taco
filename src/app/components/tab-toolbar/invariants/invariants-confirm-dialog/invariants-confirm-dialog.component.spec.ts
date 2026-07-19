import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvariantsConfirmDialogComponent } from './invariants-confirm-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

describe('InvariantsConfirmDialogComponent', () => {
    let component: InvariantsConfirmDialogComponent;
    let fixture: ComponentFixture<InvariantsConfirmDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvariantsConfirmDialogComponent, TranslateModule.forRoot()],
            providers: [
                { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(InvariantsConfirmDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
