import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvariantsModalComponent } from './invariants-modal.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

describe('InvariantsModalComponent', () => {
    let component: InvariantsModalComponent;
    let fixture: ComponentFixture<InvariantsModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvariantsModalComponent, TranslateModule.forRoot()],
            providers: [
                { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
                { provide: MAT_DIALOG_DATA, useValue: { notations: [] } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(InvariantsModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
