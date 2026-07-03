import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvariantsConfirmDialogComponent } from './invariants-confirm-dialog.component';

describe('InvariantsConfirmDialogComponent', () => {
    let component: InvariantsConfirmDialogComponent;
    let fixture: ComponentFixture<InvariantsConfirmDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvariantsConfirmDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InvariantsConfirmDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
