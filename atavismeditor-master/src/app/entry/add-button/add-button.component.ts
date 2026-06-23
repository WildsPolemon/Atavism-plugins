import {Component, EventEmitter, OnDestroy, Output, ViewEncapsulation} from '@angular/core';
import {getProfilePipe} from '../../directives/utils';
import {AddButtonPosition, Profile} from '../../settings/profiles/profile';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {Subject} from 'rxjs';
import {fuseAnimations} from '@fuse/animations';

@Component({
  selector: 'atv-add-button',
  templateUrl: './add-button.component.html',
  styleUrls: ['./add-button.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})
export class AddButtonComponent implements OnDestroy {
  @Output() public openForm: EventEmitter<void> = new EventEmitter<void>();
  public profile?: Profile;
  public AddButtonPosition = AddButtonPosition;
  private destroyer = new Subject<void>();

  constructor(private readonly profilesService: ProfilesService) {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
    });
  }

  public clickOnButton(): void {
    this.openForm.emit();
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
