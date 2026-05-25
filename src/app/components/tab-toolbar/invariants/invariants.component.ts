import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { filter, Subscription, switchMap, tap } from 'rxjs';
import { Diagram } from 'src/app/classes/diagram/diagram';
import { DisplayService } from 'src/app/services/display.service';
import { InvariantsService } from 'src/app/services/invariants.service';
import { InvariantsDisplayComponent } from './invariants-display/invariants-display.component';
import { InvariantsTableComponent } from './invariants-table/invariants-table.component';

@Component({
    selector: 'app-invariants',
    standalone: true,
    imports: [InvariantsDisplayComponent, InvariantsTableComponent],
    templateUrl: './invariants.component.html',
    styleUrl: './invariants.component.css',
})
export class InvariantsComponent implements OnInit, OnDestroy {
    private _sub?: Subscription;

    private _displayService = inject(DisplayService);
    private _invariantsService = inject(InvariantsService);

    inputInvariants = this._invariantsService.inputInvariants;
    calculatedInvariants = this._invariantsService.calculatedInvariants;
    
    ngOnInit(): void {
        this._sub = this._displayService.diagram$
            .pipe(
                tap((diagram) => {
                    console.log("Diagram: ", diagram);
                    if (!diagram) {
                        this._invariantsService.resetInvariants();
                    }
                }),
                filter((diagram: any) => !!diagram && diagram instanceof Diagram),
                tap((diagram: Diagram) => {
                    this._invariantsService.findInvariants(diagram);
                }),
            )
            .subscribe((marking) => {
                ;
            });
    }

    ngOnDestroy(): void {
        this._sub?.unsubscribe();
    }
}