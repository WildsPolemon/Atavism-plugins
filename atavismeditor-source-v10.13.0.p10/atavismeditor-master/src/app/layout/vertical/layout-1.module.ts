import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {FuseSidebarModule} from '@fuse/components';
import {FuseSharedModule} from '@fuse/shared.module';
import {VerticalLayout1Component} from './layout-1.component';
import {NavbarVerticalStyle1Module} from '../components/navbar/style-1/style-1.module';
import {QuickPanelModule} from '../components/quick-panel/quick-panel.module';
import {ToolbarModule} from '../components/toolbar/toolbar.module';

@NgModule({
  declarations: [VerticalLayout1Component],
  imports: [RouterModule, FuseSharedModule, FuseSidebarModule, NavbarVerticalStyle1Module, QuickPanelModule, ToolbarModule],
  exports: [VerticalLayout1Component],
})
export class VerticalLayout1Module {}
