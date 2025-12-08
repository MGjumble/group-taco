import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { PetriNetSavingService } from '../../../services/petri-net-saving.service';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

@Component({
    selector: 'app-save',
    imports: [MatIcon, MatButton, MatMenu, MatMenuItem, MatMenuTrigger],
    templateUrl: './save.component.html',
    styleUrl: './save.component.css',
})
export class SaveComponent {
    private _petriNetSavingService = inject(PetriNetSavingService);

    protected onSave(format: 'json' | 'pnml') {
        this._petriNetSavingService.savePetriNet(format);
    }
}
