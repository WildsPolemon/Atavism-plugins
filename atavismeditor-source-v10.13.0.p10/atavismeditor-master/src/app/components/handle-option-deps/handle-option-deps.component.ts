import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ProfilesService } from '../../settings/profiles/profiles.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SubFormService, TableTooltip } from '../../entry/sub-form.service';
import { UsageType } from '../handle-dependencies/handle-dependencies.data';
import { TabTypes } from '../../models/tabTypes.enum';
import { DataBaseProfile, DataBaseType, Profile } from '../../settings/profiles/profile';
import { Subject } from 'rxjs';
import { getProfilePipe } from '../../directives/utils';
import { filter, map, takeUntil } from 'rxjs/operators';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { UsageOptionModel } from './handle-option-deps.data';
import { EditorOption, EditorOptionChoice } from '../../entry/option-choices/option-choices.data';
import { FormFieldType } from '../../models/configs';
import { TranslateService } from '@ngx-translate/core';
import { usedItemValidator } from '../../validators/usedItem.validator';
import { LoadingService } from '../loading/loading.service';
import { DatabaseService } from '../../services/database.service';
import {
  characterItemTable,
  characterSkillsTable,
  characterStatTable,
  characterTemplateTable,
  dialogueActionsRequirementsTable,
  dialogueActionsTable
} from '../../entry/tables.data';
import { DropdownValue } from '../../models/configRow.interface';

interface PassedOptionData {
  deps: Record<string, UsageOptionModel[]>;
  record: EditorOption;
  type: number;
}

@Component({
  selector: 'atv-handle-option-deps',
  templateUrl: './handle-option-deps.component.html',
  styleUrls: ['./handle-option-deps.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandleOptionDepsComponent implements OnInit {
  public deps: Record<string, UsageOptionModel[]> = {};
  public choicesKeys: string[] = [];
  public tabType: TabTypes = TabTypes.HANDLE_DEPENDENCIES;
  public tabTypes = TabTypes;
  public form: FormGroup = this.fb.group({
    hiddenId: '',
  });
  public UsageType = UsageType;
  public itemName!: string;
  public showTooltip = false;
  public modalType!: number;
  private profile!: Profile;
  private destroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly profilesService: ProfilesService,
    public matDialogRef: MatDialogRef<HandleOptionDepsComponent>,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly subFormService: SubFormService,
    private readonly translate: TranslateService,
    private readonly loadingService: LoadingService,
    private readonly databaseService: DatabaseService,
    @Inject(MAT_DIALOG_DATA) private data: PassedOptionData
  ) {
    this.deps = this.data.deps;
    this.prepareDeps(this.data.deps);
    this.choicesKeys = Object.keys(this.data.deps);
    this.modalType = this.data.type;
    this.itemName = this.data.record.optionType;
    this.changeDetectorRef.markForCheck();
  }

  ngOnInit(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
    });
    this.subFormService.showTooltips
      .pipe(
        filter(() => !!this.tabType),
        map((tables) => tables.find((item) => item.table === this.tabType) as TableTooltip),
        filter((tableTooltip: TableTooltip) => !!tableTooltip),
        map((tableTooltip: TableTooltip) => tableTooltip.value),
        takeUntil(this.destroyer)
      )
      .subscribe((showTooltip) => {
        this.showTooltip = showTooltip;
        this.changeDetectorRef.markForCheck();
      });
  }

  public async confirmRemove(): Promise<void> {
    if (this.form.valid) {
      this.loadingService.show();
      let executeWorldContentList: string[] = [];
      const executeAdminList: string[] = [];
      for (const key of this.choicesKeys) {
        for (const dep of this.deps[key]) {
          if (dep.usageType === UsageType.clearFieldSet) {
            const sql = this.clearFieldSet(dep);
            if (sql.length > 0) {
              if (!dep.dbType || dep.dbType === DataBaseType.world_content) {
                executeWorldContentList.push(sql);
              }
            }
          } else if (dep.usageType === UsageType.updateDefault) {
            if (!dep.dbType || dep.dbType === DataBaseType.world_content) {
              executeWorldContentList.push(this.updateByDefaults(dep));
            } else if (dep.dbType === DataBaseType.admin) {
              executeAdminList.push(this.updateByDefaults(dep));
            }
          } else if (dep.usageType === UsageType.emptyValue) {
            if (!dep.dbType || dep.dbType === DataBaseType.world_content) {
              executeWorldContentList.push(this.updateByEmpty(dep));
            }
          } else if (dep.usageType === UsageType.deleteRecord) {
            if (!dep.dbType || dep.dbType === DataBaseType.world_content) {
              if (dep.table === characterTemplateTable) {
                executeWorldContentList.push(
                  `DELETE FROM ${characterSkillsTable} WHERE character_create_id IN (SELECT id FROM ${dep.table} WHERE ${dep.field} = '${
                    dep.value
                  }' ${dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''})`
                );
                executeWorldContentList.push(
                  `DELETE FROM ${characterStatTable} WHERE character_create_id IN (SELECT id FROM ${dep.table} WHERE ${dep.field} = '${
                    dep.value
                  }' ${dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''})`
                );
                executeWorldContentList.push(
                  `DELETE FROM ${characterItemTable} WHERE character_create_id IN (SELECT id FROM ${dep.table} WHERE ${dep.field} = '${
                    dep.value
                  }' ${dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''})`
                );
              } else if (dep.table === dialogueActionsTable) {
                executeWorldContentList.push(
                  `DELETE FROM ${dialogueActionsRequirementsTable} WHERE dialogue_action_id IN (SELECT id FROM ${dep.table} WHERE ${
                    dep.field
                  } = '${dep.value}' ${dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''})`
                );
              }
              executeWorldContentList.push(this.deleteRecords(dep));
            }
          } else if (dep.usageType === UsageType.deleteInString) {
            if (!dep.dbType || dep.dbType === DataBaseType.world_content) {
              executeWorldContentList = [...executeWorldContentList, ...(await this.deleteInStrings(dep))];
            }
          } else if (dep.usageType === UsageType.change) {
            const formName = dep.table + '_' + dep.field;
            if (!dep.choiceIdAsI && dep.value === this.form.get(formName)?.value) {
              this.changeDetectorRef.markForCheck();
              this.loadingService.hide();
              return;
            }
            if (!dep.dbType || dep.dbType === DataBaseType.world_content) {
              executeWorldContentList.push(await this.changeValue(dep));
            }
          }
        }
      }
      try {
        if (executeWorldContentList.length > 0) {
          const profile = this.getDBProfile(DataBaseType.world_content);
          await this.databaseService.transactionQueries(profile, executeWorldContentList);
        }
        if (executeAdminList.length > 0) {
          const profile = this.getDBProfile(DataBaseType.admin);
          await this.databaseService.transactionQueries(profile, executeAdminList);
        }
        this.close(true);
      } catch (e) {
        this.close();
      }
    } else {
      this.form.markAllAsTouched();
      this.form.markAsDirty();
      this.changeDetectorRef.markForCheck();
    }
  }

  public close(result = false): void {
    this.matDialogRef.close(result);
  }

  public toggleTooltips(event: MatSlideToggleChange): void {
    this.subFormService.toggleTooltip(this.tabType, event.checked);
  }

  public errors(name: string): string[] {
    const field = this.form.get(name) as AbstractControl;
    if (field && (field.dirty || field.touched) && field.errors) {
      return Object.keys(field.errors).map((key) => key.toUpperCase());
    }
    return [];
  }

  private async changeValue(dep: UsageOptionModel): Promise<string> {
    let value = this.form.get(dep.table + '_' + dep.field)?.value ?? '';
    if (dep.choiceIdAsI) {
      const options: EditorOptionChoice[] = await this.databaseService.customQuery(
        this.getDBProfile(DataBaseType.world_content),
        `SELECT * FROM editor_option_choice WHERE isactive = 1 AND optionTypeID = ?`,
        [this.data.record.id]
      );
      const oldList: DropdownValue[] = [];
      const list: DropdownValue[] = [];
      let i = 1;
      let j = 1;
      for (const opt of options) {
        oldList.push({id: j, value: opt.choice});
        ++j;
        if (opt.choice !== dep.optionName) {
          list.push({id: i, value: opt.choice});
          ++i;
        }
      }
      const selectedItemInOldList = oldList.find((it) => it.id === value);
      if (selectedItemInOldList) {
        const newItem = list.find((it) => it.value === selectedItemInOldList.value);
        if (newItem) {
          value = newItem.id;
        }
      }
    }

    return `UPDATE ${dep.table} SET ${dep.field} = '${value}' WHERE ${dep.field} = '${dep.value}' ${
      dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
    }`;
  }

  private updateByDefaults(dep: UsageOptionModel): string {
    let defaultValue = '-1';
    if (dep.defaultValue) {
      defaultValue = dep.defaultValue;
    }
    return `UPDATE ${dep.table} SET ${dep.field} = '${defaultValue}' WHERE ${dep.field} = '${dep.value}' ${
      dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
    }`;
  }

  private updateByEmpty(dep: UsageOptionModel): string {
    return `UPDATE ${dep.table} SET ${dep.field} = '' WHERE ${dep.field} = '${dep.value}' ${
      dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
    }`;
  }

  private deleteRecords(dep: UsageOptionModel): string {
    return `DELETE FROM ${dep.table} WHERE ${dep.field} = '${dep.value}' ${
      dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
    }`;
  }

  private clearFieldSet(dep: UsageOptionModel): string {
    if (dep.module === TabTypes.ITEMS) {
      const number = dep.field.replace(/[^0-9]/g, '');
      if (number && dep.options && dep.options?.length > 0) {
        return `UPDATE ${
          dep.table
        } SET effect${number}type = '', effect${number}name = '', effect${number}value = '' WHERE 1 = 1 AND ${dep.options.join(
          ' AND '
        )} AND ${dep.field} = '${dep.value}'`;
      }
    } else if (dep.module === TabTypes.ITEM_SETS || dep.module === TabTypes.ENCHANT_PROFILE) {
      const number = dep.field.replace(/[^0-9]/g, '');
      if (number && dep.options && dep.options?.length > 0) {
        return `UPDATE ${
          dep.table
        } SET effect${number}name = '', effect${number}value = '', effect${number}valuep = '' WHERE 1 = 1 AND ${dep.options.join(
          ' AND '
        )} AND ${dep.field} = '${dep.value}'`;
      }
    }
    return '';
  }

  private async deleteInStrings(dep: UsageOptionModel): Promise<string[]> {
    const profile = dep.dbType ? this.getDBProfile(dep.dbType) : this.getDBProfile(DataBaseType.world_content);
    const result = await this.databaseService.customQuery(
      profile,
      `SELECT ${dep.field} as multipleItems FROM ${dep.table} WHERE 1 = 1 ${
        dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
      }`
    );
    const sqls = [];
    if (result) {
      for (const row of result) {
        if (row.multipleItems.split(';').includes('' + dep.value)) {
          const multipleItems = row.multipleItems
            .split(';')
            .filter((item: string) => item !== '' + dep.value)
            .join(';');
          sqls.push(
            `UPDATE ${dep.table} SET ${dep.field} = '${multipleItems}' WHERE ${dep.field} = '${row.multipleItems}' ${
              dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
            }`
          );
        }
      }
    }
    return sqls;
  }

  private prepareDeps(deps: Record<string, UsageOptionModel[]>): void {
    Object.keys(deps).forEach((key) => {
      for (const dep of deps[key]) {
        if (dep.usageType === UsageType.change) {
          const fieldName = dep.table + '_' + dep.field;
          const label = dep.module.toUpperCase() + '.' + dep.field.toUpperCase();
          dep.formField = {
            name: fieldName,
            label: this.translate.instant(dep.label ?? label),
            tooltip: this.translate.instant((dep.label ?? label) + '_HELP'),
            type: FormFieldType.dynamicDropdown,
            allowNew: true,
            require: true,
            fieldConfig: dep.fieldConfig,
            multiple: !!dep.multiple,
          };
          if (!dep.value) {
            dep.value = '';
          }
          if (dep.choiceIdAsI) {
            this.form.addControl(fieldName, new FormControl(null, [Validators.required.bind(Validators)]));
          } else {
            this.form.addControl(fieldName, new FormControl(null, [Validators.required.bind(Validators), usedItemValidator(dep.value)]));
          }
        }
      }
    });
  }

  private getDBProfile(type: DataBaseType): DataBaseProfile {
    return this.profile.databases.find((dbProfile) => dbProfile.type === type) as DataBaseProfile;
  }
}
