import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {FormFieldConfig} from '../../../../models/configs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {SubFormService, TableTooltip} from '../../../../entry/sub-form.service';
import {ElectronService} from '../../../../services/electron.service';
import {TranslateService} from '@ngx-translate/core';
import {Subject} from 'rxjs';
import {PopoverDirective} from 'ngx-smart-popover';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {AbstractControl, FormGroup} from '@angular/forms';
import {ProfilesService} from '../../../../settings/profiles/profiles.service';
import {NotificationService} from '../../../../services/notification.service';

@Component({
  selector: 'atv-folder-selecter',
  templateUrl: './folder-selecter.component.html',
  styleUrls: ['./folder-selecter.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderSelecterComponent implements OnInit, OnDestroy {
  @ViewChild(PopoverDirective) public popover?: PopoverDirective;
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup;
  @Input() public field!: FormFieldConfig;
  @Input() public currentFolder = '';
  @Input() public errors: string[] = [];

  public disableTooltip = true;
  private destroyer = new Subject<void>();

  constructor(
    private readonly subFormService: SubFormService,
    private readonly profileService: ProfilesService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly electronService: ElectronService,
    private readonly translateService: TranslateService,
    private readonly notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.subFormService.showTooltips
      .pipe(
        filter(() => !!this.tableType),
        map(
          (tables: TableTooltip[]) =>
            tables.find((item: TableTooltip) => item.table === this.tableType) as TableTooltip,
        ),
        filter((tableTooltip: TableTooltip) => !!tableTooltip),
        map((tableTooltip: TableTooltip) => tableTooltip.value),
        takeUntil(this.destroyer),
      )
      .subscribe((showTooltip) => {
        this.disableTooltip = !showTooltip;
        this.changeDetectorRef.markForCheck();
      });
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  public chooseFolder(field: string): void {
    this.electronService.remote.dialog
      .showOpenDialog({
        title: this.translateService.instant('PROFILES.CHOOSE_FOLDER_TITLE'),
        properties: ['openDirectory'],
      })
      .then((result: any) => {
        if (!result.canceled) {
          let selectedFolder = result.filePaths[0];
          selectedFolder = selectedFolder.replace(/\\/g, '/');
          if (field !== 'folder') {
            const projectFolder = (this.form.get('folder') as AbstractControl).value;
            selectedFolder = selectedFolder.replace(projectFolder, '');
          } else {
            if (this.currentFolder !== selectedFolder && selectedFolder.length > 0) {
              const usedFolders = this.profileService.list.filter((item) => item.folder === selectedFolder).length;
              if (usedFolders) {
                this.notification.warn(this.translateService.instant('PROFILES.PROFILE_FOLDER_USED'));
                selectedFolder = this.currentFolder;
              }
            }
          }
          (this.form.get(field) as AbstractControl).patchValue(selectedFolder);
        }
      });
  }
}
