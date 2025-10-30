import { Component, inject, output } from '@angular/core';
import { DisplayComponent } from '../../display/display.component';
import { ParserService } from '../../../services/parser.service';
import { DisplayService } from '../../../services/display.service';
import { ClearNetButtonComponent } from '../../clear-net-button/clear-net-button.component';

@Component({
    selector: 'app-play',
    standalone: true,
    imports: [DisplayComponent, ClearNetButtonComponent],
    templateUrl: './play.component.html',
    styleUrl: './play.component.css',
})
export class PlayComponent {
    readonly clearAll = output<void>();
    readonly fileContent = output<string>();

    private _parserService = inject(ParserService);
    private _displayService = inject(DisplayService);

    public processSourceChange(newSource: string) {
        console.log('PlayComponent: Processing file content', newSource);

        // Emit the file content so it can be propagated up to the app component
        this.fileContent.emit(newSource);

        const result = this._parserService.parse(newSource);
        if (result !== undefined) {
            this._displayService.display(result);
            console.log('PlayComponent: Diagram displayed', result);
        } else {
            console.log('PlayComponent: Failed to parse content');
        }
    }

    public onNetCleared() {
        console.log('PlayComponent: Net cleared from button');
    }

    public onClearAll() {
        this.clearAll.emit();
        console.log('PlayComponent: Clear all event emitted');
    }
}
