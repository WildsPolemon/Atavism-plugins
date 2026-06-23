import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {FuseNavigationService} from '@fuse/components/navigation/navigation.service';
import {FuseNavigation} from '../../types';

@Component({
  selector: 'fuse-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FuseNavigationComponent implements OnInit {
  @Input()
  public layout = 'vertical';
  public navigation: FuseNavigation[] = [];

  constructor(private changeDetectorRef: ChangeDetectorRef, private fuseNavigationService: FuseNavigationService) {}

  public ngOnInit(): void {
    this.init();
  }

  private init() {
    this.fuseNavigationService.navigation.subscribe((navigation) => {
      this.navigation = navigation;
      this.changeDetectorRef.markForCheck();
    });
  }
}
