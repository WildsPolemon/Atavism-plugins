import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FuseDirectivesModule} from '@fuse/directives/directives';
import {MaterialModule} from './material.module';
import {CustomComponentModule} from '../app/components/custom-component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FuseDirectivesModule,
    MaterialModule,
    CustomComponentModule,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FuseDirectivesModule,
    MaterialModule,
    CustomComponentModule,
  ],
})
export class FuseSharedModule {}
