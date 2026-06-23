import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import {fromEvent, Subject, Subscription} from 'rxjs';
import {filter, take, takeUntil} from 'rxjs/operators';
import {TablesService} from '../../../services/tables.service';
import {DialogConfig, TableConfig} from '../../../models/configs';
import {TabTypes} from '../../../models/tabTypes.enum';
import {ProfilesService} from '../../../settings/profiles/profiles.service';
import {getProfilePipe} from '../../../directives/utils';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {ActionsTypes, TableAction} from '../../../models/actions.interface';
import {TemplatePortal} from '@angular/cdk/portal';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {MatDialog} from '@angular/material/dialog';
import {FuseConfirmDialogComponent} from '../../../../@fuse/components/confirm-dialog/confirm-dialog.component';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'atv-record-preview',
  templateUrl: './record-preview.component.html',
  styleUrls: ['./record-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class RecordPreviewComponent implements OnInit, OnDestroy {
  @ViewChild('contextMenuTemplate2') contextMenuTemplate!: TemplateRef<any>;

  @Input() public config!: TableConfig;

  @Output() switchActive = new EventEmitter();

  public loading = true;
  public record: Record<string, any> | undefined = undefined;
  public TabTypes = TabTypes;
  public newSubs: {i: number; level: number; title: string; heading: string[]; records: any[]}[] = [];
  public iconFolder!: string;
  public overlayRef: OverlayRef | undefined;
  private sub!: Subscription;
  private destroyer = new Subject<void>();

  constructor(
    private readonly overlay: Overlay,
    private readonly matDialog: MatDialog,
    private readonly tablesService: TablesService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly profilesService: ProfilesService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly translate: TranslateService,
  ) {}

  public ngOnInit(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.iconFolder = profile.folder;
    });
    this.tablesService.preview.pipe(takeUntil(this.destroyer)).subscribe((preview) => {
      if (!preview[this.config.type] || Object.keys(preview[this.config.type]).length === 0) {
        this.record = undefined;
        this.loading = false;
        this.changeDetectorRef.markForCheck();
        return;
      }
      this.record = preview[this.config.type];
      if (
        [TabTypes.ENCHANT_PROFILE, TabTypes.BUILD_OBJECT, TabTypes.ITEM_SETS, TabTypes.ABILITY, TabTypes.RESOURCE_NODE_PROFILE].includes(
          this.config.type,
        )
      ) {
        this.newSubs = [];
        Object.keys(this.record as Record<string, any>).forEach((key) => {
          let emptyItem = false;
          for (const record of (this.record as Record<string, any>)[key]) {
            const newItem = {...record};
            const stats = newItem.subs;
            const progresses = newItem.subs2;
            const damages = newItem.subs3;
            const effects = newItem.subs4;
            const abilities = newItem.subs5;
            const coords = newItem.subs6;
            const trigger = newItem.subs7;
            delete newItem.subs;
            delete newItem.subs2;
            delete newItem.subs3;
            delete newItem.subs4;
            delete newItem.subs5;
            delete newItem.subs6;
            delete newItem.subs7;

            if (stats || effects || abilities || coords) {
              this.newSubs.push({
                i: (this.record as Record<string, any>)[key].indexOf(record) + 1,
                level: 1,
                title: key,
                heading: Object.keys(newItem),
                records: [newItem],
              });

              let title = [TabTypes.ENCHANT_PROFILE, TabTypes.ITEM_SETS].includes(this.config.type) ? 'stats' : '';
              if (this.config.type === TabTypes.BUILD_OBJECT) {
                title = 'ITEMS_REQUIRED';
              } else if (this.config.type === TabTypes.RESOURCE_NODE_PROFILE) {
                title = 'DROPS';
              }
              if (stats) {
                this.newSubs.push({
                  i: (this.record as Record<string, any>)[key].indexOf(record) + 1,
                  level: 2,
                  title,
                  heading: stats.length > 0 ? Object.keys(stats[0]) : [],
                  records: stats,
                });
              }
              if (coords) {
                this.newSubs.push({
                  i: (this.record as Record<string, any>)[key].indexOf(record) + 1,
                  level: 2,
                  title: 'COORDEFFECTS',
                  heading: coords.length > 0 ? Object.keys(coords[0]) : [],
                  records: coords,
                });
              }
              if (abilities) {
                this.newSubs.push({
                  i: (this.record as Record<string, any>)[key].indexOf(record) + 1,
                  level: 2,
                  title: 'ABILITIES',
                  heading: abilities.length > 0 ? Object.keys(abilities[0]) : [],
                  records: abilities,
                });
              }
              if (effects) {
                this.newSubs.push({
                  i: (this.record as Record<string, any>)[key].indexOf(record) + 1,
                  level: 2,
                  title: 'EFFECTS',
                  heading: effects.length > 0 ? Object.keys(effects[0]) : [],
                  records: effects,
                });
              }
              if (progresses) {
                this.newSubs.push({
                  i: (this.record as Record<string, any>)[key].indexOf(record) + 1,
                  level: 2,
                  title: 'PROGRESSES',
                  heading: progresses.length > 0 ? Object.keys(progresses[0]) : [],
                  records: progresses,
                });
              }
              if (damages) {
                this.newSubs.push({
                  i: (this.record as Record<string, any>)[key].indexOf(record) + 1,
                  level: 2,
                  title: 'DAMAGES',
                  heading: damages.length > 0 ? Object.keys(damages[0]) : [],
                  records: damages,
                });
              }
              if (trigger) {
                this.newSubs.push({
                  i: (this.record as Record<string, any>)[key].indexOf(record) + 1,
                  level: 2,
                  title: 'TRIGGER',
                  heading: trigger.length > 0 ? Object.keys(trigger[0]) : [],
                  records: trigger,
                });
              }

            } else {
              emptyItem = true;
            }
          }
          if (emptyItem) {
            this.newSubs.push({
              i: 1,
              level: 1,
              title: key,
              heading: Object.keys({...(this.record as Record<string, any>)[key][0]}),
              records: (this.record as Record<string, any>)[key],
            });
          }
        });
      }
      this.changeDetectorRef.markForCheck();
      setTimeout(() => {
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      }, 1000);
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public rowKeys(object: any): string[] {
    return Object.keys(object);
  }

  public onRightClick({x, y}: MouseEvent, element: {id: string | number; isactive: number}): void {
    this.close();
    if (this.config.type !== TabTypes.OPTION_CHOICE) {
      return;
    }
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({x, y})
      .withPositions([{originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'}]);
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });
    const item = {id: element.id, actions: this.prepareItemActions(element)};
    this.overlayRef.attach(new TemplatePortal(this.contextMenuTemplate, this.viewContainerRef, {$implicit: item}));
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

  prepareItemActions(element: {isactive: number}): TableAction[] {
    if ('isactive' in element) {
      return [...this.config.actions].filter((action) => {
        if (element.isactive === 1 && action.type === ActionsTypes.MARK_AS_REMOVED) {
          return true;
        } else if (
          element.isactive === 0 &&
          (action.type === ActionsTypes.DELETE || action.type === ActionsTypes.RESTORE)
        ) {
          return true;
        }
        return false;
      });
    }
    return [];
  }

  switchActiveCheckbox($event: MatCheckboxChange, element: {id: string | number; isactive: number}): void {
    let type;
    if (element.isactive === 1) {
      type = ActionsTypes.MARK_AS_REMOVED;
      $event.source.checked = true;
    } else if (element.isactive === 0) {
      type = ActionsTypes.RESTORE;
      $event.source.checked = false;
    }
    if (type) {
      this.switchActive.emit({id: element.id, type});
    }
  }

  public toggleAction(id: number, type: ActionsTypes): void {
    this.close();
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(type)) {
      let confirmDialogRef = this.matDialog.open(FuseConfirmDialogComponent, {
        panelClass: DialogConfig.confirmDialogOverlay,
        disableClose: false,
      });
      if (type === ActionsTypes.DELETE) {
        confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.FULL_REMOVE');
      } else if (type === ActionsTypes.RESTORE) {
        confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.ACTIVATE');
      } else if (type === ActionsTypes.MARK_AS_REMOVED) {
        confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.DEACTIVATE');
      }
      confirmDialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.switchActive.emit({id, type});
        }
        confirmDialogRef = undefined;
      });
    }
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

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
