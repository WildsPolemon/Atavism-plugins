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
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {DialogConfig, Listing, QueryParams, TableConfig, TypeMap} from '../../models/configs';
import {ActionsTypes, ActionTrigger, TableAction} from '../../models/actions.interface';
import {ConfigTypes, DropdownValue} from '../../models/configRow.interface';
import {StorageService} from '../../services/storage.service';
import {TablesService} from '../../services/tables.service';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {MatDialog} from '@angular/material/dialog';
import {FuseConfirmDialogComponent} from '@fuse/components/confirm-dialog/confirm-dialog.component';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {fromEvent, Subject, Subscription} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {LoadingService} from '../loading/loading.service';
import {TemplatePortal} from '@angular/cdk/portal';
import {filter, take} from 'rxjs/operators';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {getProfilePipe} from '../../directives/utils';
import {DialogType} from '../../models/types';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {SelectionModel} from '@angular/cdk/collections';

@Component({
  selector: 'atv-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TableComponent implements OnInit, OnDestroy {
  @ViewChild('contextMenuTemplate') contextMenuTemplate!: TemplateRef<any>;
  @ViewChild(MatPaginator, {static: false}) paginator!: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort!: MatSort;
  public displayedColumns: string[] = [];
  public dataSource!: MatTableDataSource<any>;
  public ConfigTypes = ConfigTypes;
  public expandedElement = null;
  public showPreviewLoading = false;
  public queryParams: QueryParams = {
    search: '',
    where: {},
    compare: {},
    sort: {field: 'id', order: 'asc'},
    limit: {limit: 10, page: 0},
  };
  public config!: TableConfig;
  @Input() public set tableConfig(config: TableConfig) {
    this.config = config;
    this.queryParams = this.config.queryParams;
    this.filterVisibleColumns();
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  @Input() public set data(values: any) {
    this.initTableDataSource(values);
  }
  @Input() public previewRecord = null;
  @Output() paramsChanged: EventEmitter<QueryParams> = new EventEmitter();
  @Output() actionTrigger: EventEmitter<ActionTrigger> = new EventEmitter();
  @Output() bulkActionTrigger: EventEmitter<ActionTrigger> = new EventEmitter();
  @Output() dblClick: EventEmitter<number | string> = new EventEmitter<number | string>();
  @Output() getPreview: EventEmitter<number | string> = new EventEmitter<number | string>();
  @Output() updatePreviewItem: EventEmitter<{id: number; parentId: number; type: ActionsTypes}> = new EventEmitter<{
    id: number;
    parentId: number;
    type: ActionsTypes;
  }>();
  private confirmDialogRef: DialogType<FuseConfirmDialogComponent>;
  public overlayRef: OverlayRef | undefined;
  public selection = new SelectionModel(true, []);
  public ActionsTypes = ActionsTypes;
  public tableDeleteBulkOnly = [TabTypes.LEVELXP, TabTypes.INSTANCES];
  private sub!: Subscription;
  private timer: any;
  private delay = 500;
  private prevent = false;
  private destroyer = new Subject<void>();

  constructor(
    private readonly overlay: Overlay,
    private readonly matDialog: MatDialog,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly loadingService: LoadingService,
    private readonly storageService: StorageService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly profileService: ProfilesService,
  ) {}

  public ngOnInit(): void {
    const tableSavedConfiguration: string = this.storageService.get(this.config.type + '-storage');
    if (tableSavedConfiguration) {
      const savedConfiguration = JSON.parse(tableSavedConfiguration);
      Object.keys(this.config.fields).forEach((field) => {
        const fieldConfiguration = {...this.config.fields[field]};
        if (savedConfiguration[field]) {
          if (fieldConfiguration.visible !== savedConfiguration[field].visible) {
            this.config.fields[field].visible = savedConfiguration[field].visible;
          }
          if (fieldConfiguration.filterVisible !== savedConfiguration[field].filterVisible) {
            this.config.fields[field].filterVisible = savedConfiguration[field].filterVisible;
          }
        }
      });
      this.filterVisibleColumns();
    }
    if (this.config) {
      this.filterVisibleColumns();
    }
    this.changeDetectorRef.markForCheck();
    this.profileService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.delay = profile.delay ? profile.delay : 500;
    });
  }

  public updateTable(config: TableConfig): void {
    this.config = config;
    this.filterVisibleColumns();
    this.changeDetectorRef.markForCheck();
    this.storageService.set(this.config.type + '-storage', JSON.stringify(this.config.fields));
  }

  public paramsUpdated(params: QueryParams): void {
    params.limit = this.queryParams.limit;
    this.queryParams.search = params.search;
    this.queryParams.where = {...params.where};
    this.queryParams.compare = {...params.compare};
    (this.queryParams.limit as Listing).page = 0;
    this.paginator.pageIndex = 0;
    this.paramsChanged.emit(this.queryParams);
  }

  public updatePage(page: PageEvent): void {
    this.queryParams.limit = {
      limit: page.pageSize,
      page: page.pageIndex,
    };
    this.paramsChanged.emit(this.queryParams);
  }

  public updatePaginator(pageNumber: number): void {
    if (pageNumber <= this.calculateMaxPage && this.paginator.pageIndex !== pageNumber - 1) {
      this.paginator.pageIndex = pageNumber - 1;
      this.changeDetectorRef.markForCheck();
      this.queryParams.limit = {
        limit: this.paginator.pageSize,
        page: this.paginator.pageIndex,
      };
      this.paramsChanged.emit(this.queryParams);
    }
  }

  public selectedDataValue(columnName: string, id: number | string, element: any): string | number {
    if (this.config.fields[columnName].relatedField && this.config.fields[columnName].relatedFieldData) {
      const typeToShow = element[this.config.fields[columnName].relatedField as string];
      if ((this.config.fields[columnName].relatedFieldData as TypeMap<string, DropdownValue[]>)[typeToShow]) {
        const data = (this.config.fields[columnName].relatedFieldData as TypeMap<string, DropdownValue[]>)[typeToShow];
        const relatedOption = data.find((item) => '' + item.id === '' + id);
        if (relatedOption) {
          return relatedOption.value;
        }
      }
    }
    if (!this.config.fields[columnName].data) {
      return id;
    }
    // @ts-ignore
    const option = this.config.fields[columnName].data.find((item) => item.id === id);
    if (!option) {
      return '';
    }
    return option.value;
  }

  public parseDate(date: string): string {
    if (!date) {
      return '';
    }
    return this.tablesService.parseDate(date);
  }

  public toggleAction(id: number, type: ActionsTypes): void {
    this.close();
    this.expandedElement = null;
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(type)) {
      this.confirmDialogRef = this.matDialog.open(FuseConfirmDialogComponent, {
        panelClass: DialogConfig.confirmDialogOverlay,
        disableClose: false,
      });
      if (type === ActionsTypes.DELETE) {
        this.confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.FULL_REMOVE');
      } else if (type === ActionsTypes.RESTORE) {
        this.confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.ACTIVATE');
      } else if (type === ActionsTypes.MARK_AS_REMOVED) {
        this.confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.DEACTIVATE');
      }
      this.confirmDialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.loadingService.show();
          this.actionTrigger.emit({id, type});
        }
        this.confirmDialogRef = undefined;
      });
    } else {
      this.actionTrigger.emit({id, type});
    }
  }

  public get calculateMaxPage(): number {
    return Math.ceil(this.config.count / (this.queryParams.limit as Listing).limit);
  }

  public initTableDataSource(list: any): void {
    this.dataSource = new MatTableDataSource(list);
    this.changeDetectorRef.markForCheck();
  }

  public togglePreview(element: any): void {
    this.timer = setTimeout(() => {
      if (!this.prevent) {
        if (this.config.showPreview) {
          this.expandedElement = this.expandedElement === element ? null : element;
          this.showPreviewLoading = true;
          this.getPreview.emit(element.id);
        }
      }
      this.prevent = false;
    }, this.delay);
  }

  public switchPreviewActive(parent: any, action: ActionTrigger): void {
    // this.loadingService.show();
    this.updatePreviewItem.emit({...action, parentId: parent.id});
  }

  public onRightClick({x, y}: MouseEvent, element: {id: string | number; isactive: number}): void {
    this.close();
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

  public close(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
  }

  public sortChange(event: Sort): void {
    this.queryParams.sort = {field: event.active, order: event.direction};
    (this.queryParams.limit as Listing).page = 0;
    this.paginator.pageIndex = 0;
    this.changeDetectorRef.markForCheck();
    this.paramsChanged.emit(this.queryParams);
  }

  public trackByItem(_: number, item: any): void {
    return item.id ? item.id : item.name;
  }

  public editItem(id: number | string): void {
    clearTimeout(this.timer);
    this.prevent = true;
    this.dblClick.emit(id);
  }

  prepareItemActions(element: {isactive: number}): TableAction[] {
    if (this.config.type === TabTypes.LEVELXP) {
      return [...this.config.actions];
    }
    if ('isactive' in element) {
      return [...this.config.actions].filter((action) => {
        if (
          element.isactive === 1 &&
          (action.type === ActionsTypes.MARK_AS_REMOVED ||
            action.type === ActionsTypes.EDIT ||
            action.type === ActionsTypes.DUPLICATE ||
            action.type === ActionsTypes.COPY_TO)
        ) {
          return true;
        } else if (
          element.isactive === 0 &&
          (action.type === ActionsTypes.DELETE || action.type === ActionsTypes.RESTORE)
        ) {
          return true;
        }
        return false;
      });
    } else {
      return [...this.config.actions];
    }
  }

  switchActive($event: MatCheckboxChange, element: {id: string | number; isactive: number}): void {
    let type;
    if (element.isactive === 1) {
      type = ActionsTypes.MARK_AS_REMOVED;
      $event.source.checked = true;
    } else if (element.isactive === 0) {
      type = ActionsTypes.RESTORE;
      $event.source.checked = false;
    }
    if (type) {
      this.loadingService.show();
      this.actionTrigger.emit({id: element.id, type});
    }
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  public isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  public masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data.map((item) => item.id));
  }

  public selectedAction(type: ActionsTypes): void {
    if (this.selection.selected.length > 0) {
      let confirmDialogRef = this.matDialog.open(FuseConfirmDialogComponent, {
        panelClass: DialogConfig.confirmDialogOverlay,
        disableClose: false,
      });
      if (type === ActionsTypes.MARK_AS_REMOVED) {
        confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.DEACTIVATE_SELECTED');
      } else if (type === ActionsTypes.RESTORE) {
        confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.ACTIVATE_SELECTED');
      } else if (type === ActionsTypes.DELETE) {
        confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.FULL_REMOVE_SELECTED');
      }
      confirmDialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.loadingService.show();
          this.bulkActionTrigger.emit({id: this.selection.selected, type});
          this.selection.clear();
        }
        confirmDialogRef = undefined;
      });
    }
  }

  private filterVisibleColumns(): void {
    this.displayedColumns = [];
    if (this.config.bulkActions) {
      this.displayedColumns.push('selection');
    }
    this.displayedColumns = [
      ...this.displayedColumns,
      ...Object.keys(this.config.fields)
        .filter((key) => this.config.fields[key].type !== ConfigTypes.hidden)
        .filter((key) => this.config.fields[key].visible || this.config.fields[key].alwaysVisible),
    ];
    this.displayedColumns.push('actions');
    this.changeDetectorRef.markForCheck();
  }
}
