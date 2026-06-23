import {Component, OnDestroy, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation} from '@angular/core';
import {combineLatest, fromEvent, Subject, Subscription} from 'rxjs';
import {distinctUntilChanged, filter, startWith, take, takeUntil} from 'rxjs/operators';
import {FormType} from '../../profiles/profile';
import {MatTableDataSource} from '@angular/material/table';
import {TemplatePortal} from '@angular/cdk/portal';
import {FuseConfirmDialogComponent} from '@fuse/components/confirm-dialog/confirm-dialog.component';
import {DialogConfig} from '../../../models/configs';
import {FormControl, FormGroup} from '@angular/forms';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {MatDialog} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from '../../../services/notification.service';
import {LoadingService} from '../../../components/loading/loading.service';
import {Theme, ThemesService} from '../themes.service';
import {FormComponent} from '../form/form.component';
import {fuseAnimations} from '@fuse/animations';
import {DialogType} from '../../../models/types';

@Component({
  selector: 'atv-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})
export class ListComponent implements OnDestroy {
  @ViewChild('contextMenu') contextMenu: TemplateRef<any> | undefined;
  private destroyer = new Subject();
  public themes = new MatTableDataSource<Theme>([]);
  public displayedColumns = ['name', 'size', 'colorTheme', 'selected', 'lastUsed', 'actions'];
  public searchInput = new FormControl('');
  public overlayRef: OverlayRef | undefined;
  private dialogRef: DialogType<FormComponent>;
  private confirmDialogRef: DialogType<FuseConfirmDialogComponent>;
  private sub: Subscription | undefined;

  constructor(
    private readonly overlay: Overlay,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly themesService: ThemesService,
    private readonly _matDialog: MatDialog,
    private readonly translateService: TranslateService,
    private readonly notification: NotificationService,
    private readonly loadingService: LoadingService,
  ) {
    combineLatest([
      this.themesService.themes,
      this.searchInput.valueChanges.pipe(startWith(''), distinctUntilChanged()),
    ])
      .pipe(takeUntil(this.destroyer))
      .subscribe(([themes, query]: [Theme[], string]) => {
        if (query) {
          themes = themes.filter((theme) => theme.name.toLowerCase().includes(query.toLowerCase()));
        }
        this.themes = new MatTableDataSource<Theme>(themes);
      });
  }

  public onRightClick({x, y}: MouseEvent, element: unknown): void {
    this.close();
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({x, y})
      .withPositions([{originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'}]);
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });
    this.overlayRef.attach(
      new TemplatePortal(this.contextMenu as TemplateRef<any>, this.viewContainerRef, {$implicit: element}),
    );
    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter((event) => {
          const clickTarget = event.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1),
      )
      .subscribe(() => this.close());
  }

  public close(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
  }

  public select(theme: Theme): void {
    this.close();
    this.loadingService.show();
    this.themesService.set(theme);
  }

  public toggleSelected(theme: Theme): void {
    this.loadingService.show();
    this.themesService.set(theme);
  }

  public remove(theme: Theme): void {
    this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    this.confirmDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.themesService.remove(theme);
        this.notification.success(this.translateService.instant('THEMES.REMOVE_SUCCESS'));
      }
      this.confirmDialogRef = undefined;
    });
  }

  public edit(theme: Theme): void {
    this.dialogRef = this._matDialog.open(FormComponent, {
      panelClass: DialogConfig.profileDialogOverlay,
      data: {
        theme,
        action: FormType.edit,
      },
    });
    this.dialogRef.afterClosed().subscribe((response: FormGroup) => {
      if (!response) {
        return;
      }
      this.themesService.update(theme.id, {...theme, ...response.getRawValue()});
      this.notification.success(this.translateService.instant('THEMES.UPDATE_SUCCESS'));
      this.dialogRef = undefined;
    });
  }

  public duplicate(theme: Theme): void {
    this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    this.confirmDialogRef.componentInstance.confirmMessage = this.translateService.instant('CONFIRM.CONFIRM_DUPLICATE');
    this.confirmDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.themesService.duplicate(theme);
        this.notification.success(this.translateService.instant('THEMES.DUPLICATE_SUCCESS'));
      }
      this.confirmDialogRef = undefined;
    });
  }

  public add(): void {
    this.dialogRef = this._matDialog.open(FormComponent, {
      panelClass: DialogConfig.profileDialogOverlay,
      data: {
        action: FormType.new,
      },
    });
    this.dialogRef.afterClosed().subscribe((response: FormGroup) => {
      if (!response) {
        return;
      }
      this.themesService.add(response.getRawValue());
      this.notification.success(this.translateService.instant('THEMES.ADD_SUCCESS'));
      this.dialogRef = undefined;
    });
  }

  public getSizeLabel(size: string): string {
    if (size === 'font-size-small') {
      return this.translateService.instant('THEMES.FONT_SIZE_SMALL');
    } else if (size === 'font-size-normal') {
      return this.translateService.instant('THEMES.FONT_SIZE_NORMAL');
    } else if (size === 'font-size-large') {
      return this.translateService.instant('THEMES.FONT_SIZE_LARGE');
    }
    return '';
  }

  public getColorLabel(color: string): string {
    if (color === 'theme-blue-gray-dark') {
      return this.translateService.instant('THEMES.BLUE_GRAY_DARK');
    } else if (color === 'theme-yellow-light') {
      return this.translateService.instant('THEMES.YELLOW_LIGHT');
    } else if (color === 'theme-pink-dark') {
      return this.translateService.instant('THEMES.PINK_DARK');
    } else if (color === 'theme-custom') {
      return this.translateService.instant('THEMES.CUSTOM_COLORS');
    } else {
      return this.translateService.instant('THEMES.DEFAULT_LIGHT');
    }
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
