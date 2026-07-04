import { Component, computed, ElementRef, inject, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DisplayComponent } from 'src/app/components/display/display.component';
import { SvgArcComponent } from 'src/app/components/display/svg-arc/svg-arc.component';
import { SvgNodeComponent } from 'src/app/components/display/svg-node/svg-node.component';
import { InvariantsEntryService } from 'src/app/services/invariants-entry.service';
import { InvariantsValidationService } from 'src/app/services/invariants-validation.service';

@Component({
    selector: 'app-invariants-display',
    imports: [SvgNodeComponent, SvgArcComponent, TranslateModule],
    templateUrl: './invariants-display.component.html',
    styleUrl: './invariants-display.component.css',
})
export class InvariantsDisplayComponent extends DisplayComponent {
    entryService = inject(InvariantsEntryService);
    validationService = inject(InvariantsValidationService);

    inputEntries = this.validationService.inputEntries;
}
