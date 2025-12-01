import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ModeService } from '../../../services/mode.service';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-mode-toggle',
    imports: [MatIcon, MatButton],
    templateUrl: './mode-toggle.component.html',
    styleUrl: './mode-toggle.component.css',
    standalone: true,
})
export class ModeToggleComponent {
    private _modeService = inject(ModeService);

    protected modeIcon(): string {
        return this._modeService.isExamMode() ? 'school' : 'quiz';
    }

    protected modeText(): string {
        return this._modeService.isExamMode() ? 'Wechsel zu Lernmodus' : 'Wechsel zu Prüfungsmodus';
    }

    protected modeColor(): string {
        return this._modeService.isExamMode() ? 'primary' : 'accent';
    }

    protected toggleMode() {
        this._modeService.toggleMode();
    }
}
