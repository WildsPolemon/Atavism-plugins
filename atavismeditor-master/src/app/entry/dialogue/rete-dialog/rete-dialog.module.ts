import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
// @ts-ignore
import {ReteModule} from 'vasko-retejs-angular-render-plugin';
import {ReteDialogComponent} from './rete-dialog/rete-dialog.component';
import {MaterialModule} from '@fuse/material.module';
import {TranslateModule} from '@ngx-translate/core';
import {LayoutModule} from '../../../layout/layout.module';
import {FuseModule} from '@fuse/fuse.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TextComponent} from './controls/text.control';
import {CustomNodeComponent} from './components/custom-node.component';
import {ReteDialogueHelperService} from './rete-dialogue-helper.service';

@NgModule({
  declarations: [TextComponent, ReteDialogComponent, CustomNodeComponent],
  imports: [CommonModule, ReteModule, TranslateModule, FlexLayoutModule, MaterialModule, LayoutModule, FuseModule],
  providers: [ReteDialogueHelperService],
  exports: [ReteDialogComponent],
})
export class ReteDialogModule {}
