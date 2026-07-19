import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FooterComponent } from './components/footer/footer.component';
import { MainTabComponent } from './components/main-tab/main-tab.component';
import { TranslateModule } from '@ngx-translate/core';
import { TabStateService } from './services/tab-state.service';
import { Tab } from './classes/tabs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [ReactiveFormsModule, FooterComponent, MainTabComponent, TranslateModule],
})
export class AppComponent {
    protected _tabStateService = inject(TabStateService);
    Tab = Tab;
}
