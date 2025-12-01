import { computed, inject, Injectable, signal } from '@angular/core';
import { AppMode } from '../classes/appMode';
import { ToasterNotificationService } from './toaster-notification.service';

@Injectable({ providedIn: 'root' })
export class ModeService {
    private toasterService = inject(ToasterNotificationService);
    private modeSignal = signal<AppMode>(AppMode.LEARN);

    readonly isExamMode = computed(() => this.modeSignal() == AppMode.EXAM);

    toggleMode(): void {
        this.modeSignal.update((current) => (current === AppMode.LEARN ? AppMode.EXAM : AppMode.LEARN));
        this.toasterService.showInfo('Modus gewechselt', `Du befindest dich jetzt im ${this.modeSignal()}.`);
    }
}
