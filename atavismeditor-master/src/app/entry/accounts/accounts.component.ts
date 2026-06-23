import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {ConfigTypes, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {Subject} from 'rxjs';

interface Account {
  id: number;
  username: string;
  status: number;
  character_slots: number;
  coin_current: number;
  coin_total: number;
  coin_used: number;
  islands_available: number;
  created: string;
  last_login: string;
  last_logout: string;
}

enum UserStatus {
  Banned = 0,
  Normal = 1,
  GM = 3,
  Admin = 5,
}

@Component({
  selector: 'atv-accounts',
  templateUrl: './accounts.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class AccountsComponent implements OnInit, OnDestroy {
  private tableKey: TabTypes = TabTypes.ACCOUNTS;
  private userStatus = [
    {id: UserStatus.Banned, value: this.translate.instant(TabTypes.ACCOUNTS + '.USER_STATUS.BANNED')},
    {id: UserStatus.Normal, value: this.translate.instant(TabTypes.ACCOUNTS + '.USER_STATUS.NORMAL')},
    {id: UserStatus.GM, value: this.translate.instant(TabTypes.ACCOUNTS + '.USER_STATUS.GM')},
    {id: UserStatus.Admin, value: this.translate.instant(TabTypes.ACCOUNTS + '.USER_STATUS.ADMIN')},
  ];
  public tableConfig: TableConfig = {
    type: this.tableKey,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      username: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      status: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.userStatus,
      },
      created: {type: ConfigTypes.date, visible: true, filterVisible: true, filterType: FilterTypes.date},
      last_login: {type: ConfigTypes.date, visible: true, filterVisible: true, filterType: FilterTypes.date},
    },
    actions: [{type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT}],
    queryParams: {search: '', where: {}, sort: {field: 'status', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public list: Account[] = [];
  public formConfig: FormConfig = {
    type: this.tableKey,
    title: this.translate.instant(this.tableKey + '.EDIT_TITLE'),
    fields: {status: {name: 'status', type: FormFieldType.dropdown, require: true, data: this.userStatus}},
  };
  public activeRecords = true;
  private queryParams: QueryParams = this.tableConfig.queryParams;
  private dbProfile!: DataBaseProfile;
  private dbMasterProfile!: DataBaseProfile;
  private dbTable = 'account';
  private form: FormGroup = this.fb.group({
    status: ['', [Validators.required.bind(Validators)]],
  });
  private destroyer = new Subject<void>();

  constructor(
    private readonly translate: TranslateService,
    private readonly profilesService: ProfilesService,
    private readonly databaseService: DatabaseService,
    private readonly fb: FormBuilder,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile: Profile) => {
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.admin,
      ) as DataBaseProfile;
      this.dbMasterProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.master,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        this.loadData();
      }
    });
    this.tablesService.activeTab.pipe(distinctPipe(this.destroyer)).subscribe((tab) => {
      if (!tab || (tab && tab.id !== this.tableConfig.type)) {
        this.changeDetectorRef.detach();
      } else {
        this.changeDetectorRef.reattach();
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  public async updateItem(id: number | string): Promise<void> {
    const record = await this.databaseService.queryItem<Account>(this.dbProfile, this.dbTable, 'id', id);
    if (record) {
      this.form.patchValue(record);
      const {item} = await this.tablesService.openDialog<Account>(this.formConfig, this.form);
      if (!item) {
        this.form.reset();
        this.tablesService.dialogRef = null;
        return;
      }
      await this.databaseService.update<Account>(this.dbProfile, this.dbTable, item, 'id', record.id);
      await this.databaseService.update<Account>(this.dbMasterProfile, this.dbTable, item, 'id', record.id);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
      this.loadData();
      this.form.reset();
      this.tablesService.dialogRef = null;
    }
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public actionTrigger(action: ActionTrigger): void {
    if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    }
  }

  private loadData(): void {
    this.databaseService
      .queryList<Account[]>(this.dbProfile, this.dbTable, this.tableConfig.fields, this.queryParams)
      .then((response) => {
        this.list = response.list;
        this.tableConfig.count = response.count;
        this.changeDetectorRef.markForCheck();
      })
      .finally(() => {
        this.loadingService.hide();
      });
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
