import {Component, OnDestroy, ViewEncapsulation} from '@angular/core';
import {combineLatest, Subject} from 'rxjs';
import {MatTableDataSource} from '@angular/material/table';
import {FormControl, FormGroup} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {FuseConfirmDialogComponent} from '@fuse/components/confirm-dialog/confirm-dialog.component';
import {Translations} from './translation';
import {TranslationFormComponent} from './translation-form/translation-form.component';
import {TranslateService} from '@ngx-translate/core';
import {distinctUntilChanged, startWith, takeUntil} from 'rxjs/operators';
import {TranslationService} from './translation.service';
import {FormType} from '../profiles/profile';
import {fuseAnimations} from '@fuse/animations';
import {DialogConfig} from '../../models/configs';
import {DialogType} from '../../models/types';

@Component({
  selector: 'atv-translation',
  templateUrl: './translation.component.html',
  styleUrls: ['./translation.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})
export class TranslationComponent implements OnDestroy {
  public translations = new MatTableDataSource<Translations>([]);
  public displayedColumns = ['name', 'code', 'selected', 'actions'];
  public searchInput = new FormControl('');
  private destroyer = new Subject();
  private dialogRef: DialogType<TranslationFormComponent>;
  private confirmDialogRef: DialogType<FuseConfirmDialogComponent>;

  constructor(
    private readonly translationService: TranslationService,
    private readonly _matDialog: MatDialog,
    private readonly translateService: TranslateService,
  ) {
    combineLatest([
      this.translationService.translations,
      this.searchInput.valueChanges.pipe(startWith(''), distinctUntilChanged()),
    ])
      .pipe(takeUntil(this.destroyer))
      .subscribe(([translations, query]: [Translations[], string]) => {
        let list: Translations[] = translations;
        if (query) {
          list = list.filter(
            (translation) =>
              translation.name.toLowerCase().includes(query.toLowerCase()) ||
              translation.code.toLowerCase().includes(query.toLowerCase()),
          );
        }
        this.translations = new MatTableDataSource<Translations>(list);
      });
  }

  public toggleSelected(id: string): void {
    this.translationService.selected(id);
  }

  public remove(translations: Translations): void {
    this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    this.confirmDialogRef.componentInstance.confirmTitle = this.translateService.instant('CONFIRM.REMOVE_TITLE');
    this.confirmDialogRef.componentInstance.confirmMessage = this.translateService.instant('CONFIRM.REMOVE');
    this.confirmDialogRef.componentInstance.confirmAcceptButton = this.translateService.instant('ACTIONS.CONFIRM');
    this.confirmDialogRef.componentInstance.confirmCancelButton = this.translateService.instant('ACTIONS.CANCEL');
    this.confirmDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.translationService.remove(translations);
      }
      this.confirmDialogRef = undefined;
    });
  }

  public edit(translations: Translations): void {
    this.dialogRef = this._matDialog.open(TranslationFormComponent, {
      panelClass: DialogConfig.smallDialogOverlay,
      data: {
        translations,
        action: FormType.edit,
      },
    });
    this.dialogRef.afterClosed().subscribe((response: [FormGroup, string]) => {
      if (!response) {
        return;
      }
      const form = response[0];
      const uploadContent = response[1];
      const {file} = form.getRawValue();
      this.translationService.update(translations.id, form.getRawValue(), file, uploadContent);
      this.dialogRef = undefined;
    });
  }

  public create(): void {
    this.dialogRef = this._matDialog.open(TranslationFormComponent, {
      panelClass: DialogConfig.smallDialogOverlay,
      data: {
        action: FormType.new,
      },
    });
    this.dialogRef.afterClosed().subscribe((response: [FormGroup, any]) => {
      if (!response) {
        return;
      }
      const form = response[0];
      const uploadContent = response[1];
      const {file} = form.getRawValue();
      this.translationService.add(form.getRawValue(), file, uploadContent);
      this.dialogRef = undefined;
    });
  }

  public download(id: string): void {
    const translation = this.translationService.getTranslationById(id);
    if (!translation) {
      return;
    }
    const data = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(translation.translation));
    const downloader = document.createElement('a');
    downloader.setAttribute('href', data);
    downloader.setAttribute('download', translation.file.toLowerCase() + '.json');
    downloader.click();
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
