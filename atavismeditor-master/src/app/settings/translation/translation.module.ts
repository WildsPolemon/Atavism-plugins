import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {FuseSharedModule} from '@fuse/shared.module';
import {TranslationRoutingModule} from './translation-routing.module';
import {TranslationComponent} from './translation.component';
import {TranslationFormComponent} from './translation-form/translation-form.component';

@NgModule({
  declarations: [TranslationComponent, TranslationFormComponent],
  imports: [CommonModule, TranslateModule, FuseSharedModule, TranslationRoutingModule],
})
export class TranslationModule {}
