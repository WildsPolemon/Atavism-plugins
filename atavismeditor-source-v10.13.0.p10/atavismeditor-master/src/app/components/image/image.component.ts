import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, ViewEncapsulation} from '@angular/core';
import {ImageService, ImageType} from './image.service';
import {Profile} from '../../settings/profiles/profile';
import {getProfilePipe} from '../../directives/utils';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {Subject} from 'rxjs';

@Component({
  selector: 'atv-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent implements OnDestroy {
  @Input() public alt!: string;
  public _folder = '';
  public _icon = '';
  @Input()
  public set icon(value: {icon: string; folder: string | undefined} | undefined) {
    if (!value) {
      value = {
        icon: '',
        folder: '',
      };
    }
    if (!value.folder) {
      value.folder = '';
    }
    if (!value.icon) {
      value.icon = '';
    }
    this._icon = value.icon.trim();
    this._folder = value.folder.trim();
    if (value.icon) {
      this._icon = value.icon.trim();
      this.parseIcon();
    } else {
      this.showImage = false;
      this.changeDetectorRef.markForCheck();
    }
  }

  public image = '';
  public showImage = false;
  private profile!: Profile;
  private destroyer = new Subject<void>();

  constructor(
    public imageService: ImageService,
    public changeDetectorRef: ChangeDetectorRef,
    private readonly profilesService: ProfilesService
  ) {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile: Profile) => {
      this.profile = profile;
    });
  }

  private async parseIcon(): Promise<void> {
    if (this._icon) {
      const imageType = this.imageService.getImageType(this._icon);
      if (imageType === ImageType.PSD) {
        this.image = await this.imageService.parseImage(this.profile, this._icon, true);
        this.showImage = true;
      } else if (imageType === ImageType.TGA) {
        this.image = await this.imageService.parseTgaBase(this.profile, this._icon);
        this.showImage = true;
      } else if (imageType === ImageType.IMAGE || imageType === ImageType.BMP) {
        this.image = this.imageService.getFileFullPath(this._icon, this._folder, true);
        if (!this.imageService.checkIfImageExist(this.imageService.getFileFullPath(this._icon, this._folder))) {
          this.image = this.imageService.getFileFullPath(this._icon, '', true);
        }
        this.showImage = true;
      }
      this.changeDetectorRef.markForCheck();
    }
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
