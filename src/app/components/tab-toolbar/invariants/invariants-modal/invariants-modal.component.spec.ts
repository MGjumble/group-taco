import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvariantsModalComponent } from './invariants-modal.component';

describe('InvariantsModalComponent', () => {
    let component: InvariantsModalComponent;
    let fixture: ComponentFixture<InvariantsModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvariantsModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InvariantsModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
