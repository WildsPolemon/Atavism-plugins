import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {QueryParams, TableConfig} from '../../models/configs';
import {Subject} from 'rxjs';
import {LoadingService} from '../../components/loading/loading.service';
import {TablesService} from '../../services/tables.service';
import {takeUntil} from 'rxjs/operators';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {CraftingRecipesService} from './crafting-recipes.service';
import {distinctPipe} from '../../directives/utils';
import {CraftingRecipe} from './crafting-recipes.data';

@Component({
  selector: 'atv-crafting-recipes',
  templateUrl: './crafting-recipes.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftingRecipesComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.craftingRecipesService.tableConfig;
  public list: CraftingRecipe[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.craftingRecipesService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly craftingRecipesService: CraftingRecipesService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.craftingRecipesService.init();
    this.craftingRecipesService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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

  public addItem(): void {
    this.craftingRecipesService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.craftingRecipesService.updateItem(id as number).then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<CraftingRecipe>(
          this.craftingRecipesService.dbProfile,
          this.craftingRecipesService.dbTable,
          this.craftingRecipesService.tableKey,
          action,
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        this.tablesService
          .executeAction(this.craftingRecipesService.dbProfile, this.craftingRecipesService.dbTable, action)
          .then(() => {
            this.loadData(false);
          });
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.craftingRecipesService.duplicateItem(action.id);
      if (newId) {
        await this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.craftingRecipesService.dbProfile;
      const dbTable = this.craftingRecipesService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<CraftingRecipe>(
          profile,
          dbTable,
          this.craftingRecipesService.tableKey,
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
    this.craftingRecipesService.previewItems(id as number);
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.craftingRecipesService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.craftingRecipesService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
