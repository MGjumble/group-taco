import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvariantsDisplayComponent } from './invariants-display.component';

describe('InvariantsDisplayComponent', () => {
  let component: InvariantsDisplayComponent;
  let fixture: ComponentFixture<InvariantsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvariantsDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvariantsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
