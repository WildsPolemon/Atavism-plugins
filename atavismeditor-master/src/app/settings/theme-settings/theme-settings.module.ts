import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {FuseSharedModule} from '@fuse/shared.module';
import {ThemeSettingsRoutingModule} from './theme-settings-routing.module';
import {ListComponent} from './list/list.component';
import {FormComponent} from './form/form.component';
import {ColorPickerModule} from 'ngx-color-picker';

@NgModule({
  declarations: [ListComponent, FormComponent],
  imports: [CommonModule, TranslateModule, FuseSharedModule, ThemeSettingsRoutingModule, ColorPickerModule],
})
export class ThemeSettingsModule {}
