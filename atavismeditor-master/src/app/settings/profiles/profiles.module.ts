import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {FuseSharedModule} from '@fuse/shared.module';
import {ProfilesFormComponent} from './profiles-form/profiles-form.component';
import {ProfileListComponent} from './profile-list/profile-list.component';
import {PopoverModule} from 'ngx-smart-popover';

@NgModule({
  declarations: [ProfilesFormComponent, ProfileListComponent],
  imports: [CommonModule, FuseSharedModule, PopoverModule, TranslateModule],
})
export class ProfilesModule {}
