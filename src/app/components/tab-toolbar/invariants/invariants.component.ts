import { Component } from '@angular/core';
import { InvariantsDisplayComponent } from './invariants-display/invariants-display.component';
import { InvariantsTableComponent } from './invariants-table/invariants-table.component';

@Component({
    selector: 'app-invariants',
    standalone: true,
    imports: [InvariantsDisplayComponent, InvariantsTableComponent],
    templateUrl: './invariants.component.html',
    styleUrl: './invariants.component.css',
})
export class InvariantsComponent {
}
