import { computed, inject, Injectable, signal } from '@angular/core';
<<<<<<< HEAD
import { AppMode } from '../classes/app-mode';
=======
import { AppMode } from '../classes/appMode';
>>>>>>> a8e96f8 ([FPWGT-29] Add Service/Component for Switching between Learn and Exam mode)
import { ToasterNotificationService } from './toaster-notification.service';

@Injectable({ providedIn: 'root' })
export class ModeService {
<<<<<<< HEAD
    private _toasterService = inject(ToasterNotificationService);
    private _modeSignal = signal<AppMode>(AppMode.LEARN);

    /**
     * Exposes the current application mode as a read-only signal.
     */
    readonly currentMode = this._modeSignal.asReadonly();

    /**
     * Computed signal that indicates whether the application is in EXAM mode.
     */
    readonly isExamMode = computed(() => this._modeSignal() === AppMode.EXAM);

    /**
     * Toggles the application mode between LEARN and EXAM.
     */
    toggleMode(): void {
        this._modeSignal.update((current) => (current === AppMode.LEARN ? AppMode.EXAM : AppMode.LEARN));
        this._toasterService.showInfo('Modus gewechselt', `Du befindest dich jetzt im ${this._modeSignal()}.`);
=======
    private toasterService = inject(ToasterNotificationService);
    private modeSignal = signal<AppMode>(AppMode.LEARN);

    /**
     * Exposes the current application mode as a read-only signal.
     */
    readonly currentMode = this._modeSignal.asReadonly();

    /**
     * Computed signal that indicates whether the application is in EXAM mode.
     */
    readonly isExamMode = computed(() => this._modeSignal() === AppMode.EXAM);

    /**
     * Toggles the application mode between LEARN and EXAM.
     */
    toggleMode(): void {
        this.modeSignal.update((current) => (current === AppMode.LEARN ? AppMode.EXAM : AppMode.LEARN));
        this.toasterService.showInfo('Modus gewechselt', `Du befindest dich jetzt im ${this.modeSignal()}.`);
>>>>>>> a8e96f8 ([FPWGT-29] Add Service/Component for Switching between Learn and Exam mode)
    }
}
