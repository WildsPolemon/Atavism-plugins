import {NgModule} from '@angular/core';
import {FuseNavigationModule} from '@fuse/components';
import {FuseSharedModule} from '@fuse/shared.module';
import {TranslateModule} from '@ngx-translate/core';
import {NavbarVerticalStyle1Component} from './style-1.component';
import {MaterialModule} from '@fuse/material.module';

@NgModule({
  declarations: [NavbarVerticalStyle1Component],
  imports: [MaterialModule, FuseSharedModule, FuseNavigationModule, TranslateModule.forChild()],
  exports: [NavbarVerticalStyle1Component],
})
export class NavbarVerticalStyle1Module {}
