import { Component, inject, output } from '@angular/core';
import { DisplayComponent } from '../../display/display.component';
import { ParserService } from '../../../services/parser.service';
import { DisplayService } from '../../../services/display.service';
import { ClearNetButtonComponent } from '../../clear-net-button/clear-net-button.component';

@Component({
    selector: 'app-draw',
    standalone: true,
    imports: [DisplayComponent, ClearNetButtonComponent],
    templateUrl: './draw.component.html',
    styleUrl: './draw.component.css',
})
export class DrawComponent {
    readonly clearAll = output<void>();
    readonly fileContent = output<string>();

    private _parserService = inject(ParserService);
    private _displayService = inject(DisplayService);

    public processSourceChange(newSource: string) {
        console.log('DrawComponent: Processing file content', newSource);

        // Emit the file content so it can be propagated up to the app component
        this.fileContent.emit(newSource);

        const result = this._parserService.parse(newSource);
        if (result !== undefined) {
            this._displayService.display(result);
            console.log('DrawComponent: Diagram displayed', result);
        } else {
            console.log('DrawComponent: Failed to parse content');
        }
    }

    public onNetCleared() {
        console.log('DrawComponent: Net cleared from button');
    }

    public onClearAll() {
        this.clearAll.emit();
        console.log('DrawComponent: Clear all event emitted');
    }
}
