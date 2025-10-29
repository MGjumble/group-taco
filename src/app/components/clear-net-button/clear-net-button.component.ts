import { Component, input, output, inject } from '@angular/core';
import { DisplayService } from '../../services/display.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'clear-net-button',
    standalone: true,
    imports: [MatButton, MatIcon],
    templateUrl: './clear-net-button.component.html',
    styleUrls: ['./clear-net-button.component.css'],
})
export class ClearNetButtonComponent {
    readonly title = input<string>('Clear Net');
    readonly buttonCleared = output<void>();

    private _displayService = inject(DisplayService);

    public clearNet() {
        this._displayService.clear();
        this.buttonCleared.emit();
        console.log('Network cleared');
    }
}
