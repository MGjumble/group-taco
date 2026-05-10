import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvariantsComponent } from './invariants.component';

describe('InvariantsComponent', () => {
    let component: InvariantsComponent;
    let fixture: ComponentFixture<InvariantsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvariantsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InvariantsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
