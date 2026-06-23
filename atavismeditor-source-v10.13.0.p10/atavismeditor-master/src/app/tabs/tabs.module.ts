import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FuseSharedModule} from '@fuse/shared.module';
import {TranslateModule} from '@ngx-translate/core';
import {TabsRoutingModule} from './tabs-routing.module';
import {TabsComponent} from './tabs.component';
import {TabComponent} from './tab/tab.component';
import {TabDirective} from './tab/tab.directive';

@NgModule({
  declarations: [TabsComponent, TabComponent, TabDirective],
  imports: [CommonModule, TabsRoutingModule, TranslateModule, FuseSharedModule],
})
export class TabsModule {}
