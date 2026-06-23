import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {Subject} from 'rxjs';
import {LoadingService} from '../../components/loading/loading.service';
import {distinctPipe} from '../../directives/utils';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {DialogConfig, QueryParams, TableConfig} from '../../models/configs';
import {DialogType} from '../../models/types';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {Dialogue} from './dialogue.data';
import {DialogueService} from './dialogue.service';
import {ReteDialogComponent} from './rete-dialog/rete-dialog/rete-dialog.component';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-dialogue',
  templateUrl: './dialogue.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogueComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.dialogueService.tableConfig;
  public list: Dialogue[] = [];
  public activeRecords = true;
  public dialogRef: DialogType<ReteDialogComponent>;
  private queryParams: QueryParams = this.dialogueService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly dialogueService: DialogueService,
    private readonly translate: TranslateService,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
    private readonly matDialog: MatDialog,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.dialogueService.init();
    this.dialogueService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.list = list;
      this.changeDetectorRef.markForCheck();
    });
    this.tablesService.activeTab.pipe(distinctPipe(this.destroyer)).subscribe((tab) => {
      if (!tab || (tab && tab.id !== this.tableConfig.type)) {
        this.changeDetectorRef.detach();
      } else {
        this.changeDetectorRef.reattach();
        this.changeDetectorRef.markForCheck();
      }
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadData();
    });
    this.loadData();
  }

  public async addItem(): Promise<void> {
    const reload = await this.dialogueService.addItem(true);
    if (reload) {
      this.loadData(true);
    }
    this.loadingService.hide();
  }

  public async updateItem(id: number | string): Promise<void> {
    const reload = await this.dialogueService.updateItem(id as number);
    if (reload) {
      this.loadData(true);
    }
    this.loadingService.hide();
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<Dialogue>(
          this.dialogueService.dbProfile,
          this.dialogueService.dbTable,
          this.dialogueService.tableKey,
          action,
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(this.dialogueService.dbProfile, this.dialogueService.dbTable, action);
        await this.loadData(true);
      }
    } else if (action.type === ActionsTypes.EDIT) {
      await this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.dialogueService.duplicateItem(action.id);
      if (newId) {
        this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.dialogueService.dbProfile;
      const dbTable = this.dialogueService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<Dialogue>(
          profile,
          dbTable,
          this.dialogueService.tableKey,
          action,
        );
        if (result.length > 0) {
          await this.loadData(true);
        }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        await this.loadData(true);
      }
    }
  }

  public getPreviewItem(id: number | string): void {
    this.dialogRef = this.matDialog.open(ReteDialogComponent, {
      panelClass: DialogConfig.fullDialogOverlay,
      data: {id},
    });
    this.dialogRef
      .beforeClosed()
      .toPromise()
      .then((response) => {
        if (response) {
          this.dialogueService.saveTreeDialogues(response).then(() => {
            this.notification.success(this.translate.instant('DIALOGUE.TREE_SAVED'));
            this.loadingService.hide();
          });
        }
      });
  }

  public ngOnDestroy(): void {
    this.dialogueService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.dialogueService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }
}
