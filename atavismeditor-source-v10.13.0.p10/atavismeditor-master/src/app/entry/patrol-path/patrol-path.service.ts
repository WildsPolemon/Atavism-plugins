import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {DialogConfig, FormConfig, FormFieldType, TableConfig} from '../../models/configs';
import {ConfigTypes, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators';
import {Utils} from '../../directives/utils';
import {DropdownItemsService} from '../dropdown-items.service';

export interface PatrolPath {
  id: number;
  name: string;
  startingPoint: boolean;
  travelReverse: boolean;
  locX: number;
  locY: number;
  locZ: number;
  lingerTime: number;
  nextPoint: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}
/* this component is commented */
@Injectable({
  providedIn: 'root',
})
export class PatrolPathService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.PATROL_PATH;
  private readonly listStream = new BehaviorSubject<PatrolPath[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = 'patrol_path';
  public form: FormGroup = this.fb.group({
    name: ['', [Validators.required.bind(Validators)]],
  });
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      isactive: {
        type: ConfigTypes.isActiveType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.dropdownItemsService.isActiveOptions,
        overrideValue: '-1',
      },
      creationtimestamp: {type: ConfigTypes.date, visible: true, filterVisible: true, filterType: FilterTypes.date},
      updatetimestamp: {type: ConfigTypes.date, visible: true, filterVisible: true, filterType: FilterTypes.date},
    },
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DUPLICATE, name: ActionsNames.DUPLICATE, icon: ActionsIcons.DUPLICATE},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.DEACTIVATE, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.smallDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {
        name: 'name',
        label: this.translate.instant(this.tableKey + '.NAME'),
        type: FormFieldType.input,
        require: true,
        length: 64,
        width: 100,
      },
    },
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
  ) {}

  public init(): void {
    this.profilesService.profile
      .pipe(
        filter((profile: any) => !!profile),
        map((profile: Profile) => profile),
        distinctUntilChanged((x, y) => Utils.equals(x, y)),
        takeUntil(this.destroyer),
      )
      .subscribe((profile) => {
        this.dbProfile = profile.databases.find(
          (dbProfile) => dbProfile.type === DataBaseType.world_content,
        ) as DataBaseProfile;
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
          this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        }
      });
  }

  public async getList(activeRecords = true): Promise<void> {
    const response = await this.databaseService.queryAll<PatrolPath>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      {
        where: {isactive: activeRecords ? 1 : 0},
      },
    );
    this.listStream.next(response);
  }

  public async addItem(): Promise<number> {
    return new Promise((resolve) => {
      this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
      this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
      this.resetForm();
      this.tablesService.openDialog<PatrolPath>(this.formConfig, this.form, {}).then(({item}) => {
        if (!item) {
          this.resetForm();
          this.tablesService.dialogRef = null;
          resolve(0);
          return;
        }
        item.startingPoint = false;
        item.travelReverse = false;
        item.locX = 0;
        item.locY = 0;
        item.locZ = 0;
        item.lingerTime = 0;
        item.nextPoint = 0;
        item.isactive = true;
        item.creationtimestamp = this.databaseService.getTimestampNow();
        item.updatetimestamp = this.databaseService.getTimestampNow();
        this.databaseService.insert<PatrolPath>(this.dbProfile, this.dbTable, item).then((newId) => {
          this.tablesService.dialogRef = null;
          resolve(newId);
        });
      });
    });
  }

  public async updateItem(id: number): Promise<number> {
    return new Promise((resolve) => {
      this.resetForm();
      this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
      this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
      this.databaseService.queryItem<PatrolPath>(this.dbProfile, this.dbTable, 'id', id).then((record) => {
        if (record) {
          this.form.patchValue(record);
          this.tablesService.openDialog<PatrolPath>(this.formConfig, this.form).then(({item}) => {
            if (!item) {
              this.resetForm();
              this.tablesService.dialogRef = null;
              resolve(0);
              return;
            }
            item.updatetimestamp = this.databaseService.getTimestampNow();
            this.databaseService.update<PatrolPath>(this.dbProfile, this.dbTable, item, 'id', record.id).then(() => {
              this.resetForm();
              this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
              this.tablesService.dialogRef = null;
              resolve(1);
            });
          });
        }
      });
    });
  }

  public duplicateItem(id: number): Promise<number> {
    return new Promise((resolve) => {
      this.databaseService.queryItem<PatrolPath>(this.dbProfile, this.dbTable, 'id', id).then((record) => {
        const item = {...record};
        // @ts-ignore
        delete item.id;
        item.name = item.name + ' (1)';
        item.creationtimestamp = this.databaseService.getTimestampNow();
        item.updatetimestamp = this.databaseService.getTimestampNow();
        this.databaseService.insert<PatrolPath>(this.dbProfile, this.dbTable, item).then((newId) => {
          this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
          resolve(newId);
        });
      });
    });
  }

  private resetForm(): void {
    this.form.reset();
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'name', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
