import {NgModule} from '@angular/core';
import {FuseInnerScrollDirective} from '@fuse/directives/fuse-inner-scroll/fuse-inner-scroll.directive';
import {FusePerfectScrollbarDirective} from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';

@NgModule({
  declarations: [FuseInnerScrollDirective, FusePerfectScrollbarDirective],
  exports: [FuseInnerScrollDirective, FusePerfectScrollbarDirective],
})
export class FuseDirectivesModule {}
