import {Component, HostBinding, Input} from '@angular/core';
import {FuseNavigationItem} from '@fuse/types';

@Component({
  selector: 'fuse-nav-vertical-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
})
export class FuseNavVerticalGroupComponent {
  @HostBinding('class') classes = 'nav-group nav-item';

  @Input() item!: FuseNavigationItem;

  public get itemClasses(): string {
    if (this.item.classes) {
      return this.item.classes;
    }
    return '';
  }
}
