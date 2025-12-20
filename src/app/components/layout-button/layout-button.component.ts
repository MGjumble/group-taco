import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { SpringEmbedderService } from '../../services/spring-embedder.service';

@Component({
    selector: 'app-layout-button',
    imports: [MatIcon, MatIconButton, MatTooltip],
    templateUrl: './layout-button.component.html',
    styleUrl: './layout-button.component.css',
})
export class LayoutButtonComponent {
    private _springEmbedderService = inject(SpringEmbedderService);

    calculateLayout() {
        this._springEmbedderService.calculateLayout().catch((error) => {
            console.error(error);
        });
    }
}
