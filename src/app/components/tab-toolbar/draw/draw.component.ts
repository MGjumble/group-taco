import { Component } from '@angular/core';
import { DisplayComponent } from '../../display/display.component';

@Component({
    selector: 'app-draw',
    standalone: true,
    imports: [DisplayComponent],
    templateUrl: './draw.component.html',
    styleUrl: './draw.component.css',
})
export class DrawComponent {}
