import {NgModule} from '@angular/core';
import {VerticalLayout1Module} from './vertical/layout-1.module';
import {MaterialModule} from '@fuse/material.module';

@NgModule({
  imports: [VerticalLayout1Module, MaterialModule],
  exports: [VerticalLayout1Module],
  declarations: [],
})
export class LayoutModule {}
