import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { PetriNetSavingService } from '../../../services/petri-net-saving.service';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
    selector: 'app-save',
    imports: [MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, MatIconButton, MatTooltip],
    templateUrl: './save.component.html',
    styleUrl: './save.component.css',
})
export class SaveComponent {
    private _petriNetSavingService = inject(PetriNetSavingService);

    protected onSave(format: 'json' | 'pnml') {
        this._petriNetSavingService.savePetriNet(format);
    }
}
