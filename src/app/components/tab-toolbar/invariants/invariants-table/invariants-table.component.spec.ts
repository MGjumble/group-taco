import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvariantsTableComponent } from './invariants-table.component';

describe('InvariantsTableComponent', () => {
    let component: InvariantsTableComponent;
    let fixture: ComponentFixture<InvariantsTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvariantsTableComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InvariantsTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
