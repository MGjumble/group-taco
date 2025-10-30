import { Component, inject, output } from '@angular/core';
import { ProcessNetDisplayComponent } from './process-net-display/process-net-display.component';
import { ParserService } from '../../../services/parser.service';
import { DisplayService } from '../../../services/display.service';
import { ClearNetButtonComponent } from '../../clear-net-button/clear-net-button.component';

@Component({
    selector: 'app-process-net',
    standalone: true,
    imports: [ProcessNetDisplayComponent, ClearNetButtonComponent],
    templateUrl: './process-net.component.html',
    styleUrl: './process-net.component.css',
})
export class ProcessNetComponent {
    readonly clearAll = output<void>();
    readonly fileContent = output<string>();

    private _parserService = inject(ParserService);
    private _displayService = inject(DisplayService);

    public processSourceChange(newSource: string) {
        console.log('ProcessNetComponent: Processing file content', newSource);

        // Emit the file content so it can be propagated up to the app component
        this.fileContent.emit(newSource);

        const result = this._parserService.parse(newSource);
        if (result !== undefined) {
            this._displayService.display(result);
            console.log('ProcessNetComponent: Diagram displayed', result);
        } else {
            console.log('ProcessNetComponent: Failed to parse content');
        }
    }

    public onNetCleared() {
        console.log('ProcessNetComponent: Net cleared from button');
    }

    public onClearAll() {
        this.clearAll.emit();
        console.log('ProcessNetComponent: Clear all event emitted');
    }
}
