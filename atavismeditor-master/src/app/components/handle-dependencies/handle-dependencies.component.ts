import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation} from '@angular/core';
import {getProfilePipe} from '../../directives/utils';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {Subject} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {UsageModel, UsageType} from './handle-dependencies.data';
import {TabTypes} from '../../models/tabTypes.enum';
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {DatabaseService} from '../../services/database.service';
import {ActionTrigger} from '../../models/actions.interface';
import {LoadingService} from '../loading/loading.service';
import {FormFieldType} from '../../models/configs';
import {SubFormService, TableTooltip} from '../../entry/sub-form.service';
import {TranslateService} from '@ngx-translate/core';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {filter, map, takeUntil} from 'rxjs/operators';
import {usedItemValidator} from '../../validators/usedItem.validator';
import {
  dialogueActionsRequirementsTable,
  dialogueActionsTable,
  itemTemplatesTable,
  skillAbilityGainTable,
  skillsTable,
  slotsGroupTable,
  slotsTable,
  statsTable,
} from '../../entry/tables.data';
import {DropdownItemsService} from '../../entry/dropdown-items.service';
import {DropdownValue} from '../../models/configRow.interface';

interface PassedData {
  deps: UsageModel[];
  module: TabTypes;
  table: string;
  name: string;
  field: string;
  action: ActionTrigger;
  dbType: DataBaseType;
}

@Component({
  selector: 'atv-handle-dependencies',
  templateUrl: './handle-dependencies.component.html',
  styleUrls: ['./handle-dependencies.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandleDependenciesComponent implements OnInit {
  public deps: UsageModel[] = [];
  public module!: TabTypes;
  public tabType: TabTypes = TabTypes.HANDLE_DEPENDENCIES;
  public tabTypes = TabTypes;
  public form: FormGroup = this.fb.group({
    hiddenId: '',
  });
  public UsageType = UsageType;
  public itemName!: string;
  public showTooltip = false;
  private profile!: Profile;
  private destroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly profilesService: ProfilesService,
    public matDialogRef: MatDialogRef<HandleDependenciesComponent>,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly databaseService: DatabaseService,
    private readonly subFormService: SubFormService,
    private readonly loadingService: LoadingService,
    private readonly translate: TranslateService,
    private readonly dropdownItemService: DropdownItemsService,
    @Inject(MAT_DIALOG_DATA) private data: PassedData,
  ) {
    this.module = this.data.module;
    this.itemName = this.data.name;
    this.changeDetectorRef.markForCheck();
  }

  public ngOnInit(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
      this.prepareDeps(this.data.deps).then((deps) => {
        this.deps = deps;
        this.changeDetectorRef.detectChanges();
      });
    });
    this.subFormService.showTooltips
      .pipe(
        filter(() => !!this.tabType),
        map((tables) => tables.find((item) => item.table === this.tabType) as TableTooltip),
        filter((tableTooltip: TableTooltip) => !!tableTooltip),
        map((tableTooltip: TableTooltip) => tableTooltip.value),
        takeUntil(this.destroyer),
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
      let executeAdminList: string[] = [];
      let executeAtavismList: string[] = [];
      for (const dep of this.data.deps) {
        if (dep.usageType === UsageType.clearFieldSet) {
          const sql = this.clearFieldSet(dep);
          if (sql.length > 0) {
            if (dep.dbType === DataBaseType.world_content) {
              executeWorldContentList.push(sql);
            } else if (dep.dbType === DataBaseType.admin) {
              executeAdminList.push(sql);
            }
          }
        } else if (dep.usageType === UsageType.updateDefault) {
          if (dep.dbType === DataBaseType.world_content) {
            executeWorldContentList.push(this.updateByDefaults(dep));
          } else if (dep.dbType === DataBaseType.admin) {
            executeAdminList.push(this.updateByDefaults(dep));
          }
        } else if (dep.usageType === UsageType.emptyValue) {
          if (dep.dbType === DataBaseType.world_content) {
            if (dep.table === statsTable) {
              let subField = '';
              const fieldValue = dep.value ? 'effect:' + dep.value : '';
              if (dep.field === 'onThreshold') {
                subField = 'threshold';
              }
              if (dep.field === 'onThreshold2') {
                subField = 'threshold2';
              }
              if (dep.field === 'onThreshold3') {
                subField = 'threshold3';
              }
              if (dep.field === 'onThreshold4') {
                subField = 'threshold4';
              }
              if (subField.length > 0) {
                executeWorldContentList.push(
                  `UPDATE ${dep.table} SET ${subField} = '-1' WHERE ${dep.field} = '${fieldValue}' ${
                    dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
                  }`,
                );
              }
            }
            executeWorldContentList.push(this.updateByEmpty(dep));
          } else if (dep.dbType === DataBaseType.admin) {
            executeAdminList.push(this.updateByEmpty(dep));
          }
        } else if (dep.usageType === UsageType.deleteRecord) {
          if (dep.dbType === DataBaseType.world_content) {
            if (dep.table === dialogueActionsTable) {
              executeWorldContentList.push(
                `DELETE FROM ${dialogueActionsRequirementsTable} WHERE dialogue_action_id IN (SELECT id FROM ${
                  dep.table
                } WHERE ${dep.field} = '${dep.value}' ${
                  dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
                })`,
              );
            }
            if (dep.tableType === TabTypes.SKILLS && dep.table === skillAbilityGainTable) {
              const skillsIds = await this.databaseService.customQuery(
                this.getDBProfile(DataBaseType.world_content),
                `SELECT skillID FROM ${skillAbilityGainTable} where abilityID = ${dep.value}`,
              );
              const skillsToUpdate = (skillsIds as {skillID: number}[]).map((skill) => skill.skillID);
              if (skillsToUpdate.length > 0) {
                executeWorldContentList.push(
                  `UPDATE ${skillsTable} SET updatetimestamp = '${this.databaseService.getTimestampNow()}' WHERE id IN (${skillsToUpdate.join(
                    ',',
                  )})`,
                );
              }
            }
            executeWorldContentList.push(this.deleteRecords(dep));
          } else if (dep.dbType === DataBaseType.admin) {
            executeAdminList.push(this.deleteRecords(dep));
          } else if (dep.dbType === DataBaseType.atavism) {
            executeAtavismList.push(this.deleteRecords(dep));
          }
        } else if (dep.usageType === UsageType.deleteInString) {
          if (dep.dbType === DataBaseType.world_content) {
            executeWorldContentList = [...executeWorldContentList, ...(await this.deleteInStrings(dep))];
          } else if (dep.dbType === DataBaseType.admin) {
            executeAdminList = [...executeAdminList, ...(await this.deleteInStrings(dep))];
          }
        } else if (dep.usageType === UsageType.change) {
          const formName = dep.table + '_' + dep.field;
          if (dep.value === this.form.get(formName)?.value) {
            this.changeDetectorRef.markForCheck();
            this.loadingService.hide();
            return;
          }
          if (dep.dbType === DataBaseType.world_content) {
            executeWorldContentList.push(this.changeValue(dep));
          } else if (dep.dbType === DataBaseType.admin) {
            executeAdminList.push(this.changeValue(dep));
          }
        }
      }
      try {
        if (executeWorldContentList.length > 0) {
          await this.databaseService.transactionQueries(
            this.getDBProfile(DataBaseType.world_content),
            executeWorldContentList,
          );
        }
        if (executeAdminList.length > 0) {
          await this.databaseService.transactionQueries(this.getDBProfile(DataBaseType.admin), executeAdminList);
        }
        if (executeAtavismList.length > 0) {
          await this.databaseService.transactionQueries(this.getDBProfile(DataBaseType.atavism), executeAtavismList);
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

  private getDBProfile(type: DataBaseType): DataBaseProfile {
    return this.profile.databases.find((dbProfile) => dbProfile.type === type) as DataBaseProfile;
  }

  private changeValue(dep: UsageModel): string {
    const value = this.form.get(dep.table + '_' + dep.field)?.value ?? '';
    let fieldName = dep.field;
    let fieldValue = value;
    let oldFieldValue = dep.value;
    if (dep.table === statsTable) {
      if (dep.field === 'onMinHitEffect') {
        fieldName = 'onMinHit';
        fieldValue = 'effect:' + value;
        oldFieldValue = 'effect:' + dep.value;
      } else if (dep.field === 'onMaxHitEffect') {
        fieldName = 'onMaxHit';
        fieldValue = 'effect:' + value;
        oldFieldValue = 'effect:' + dep.value;
      } else if (['onThreshold', 'onThreshold2', 'onThreshold3', 'onThreshold4', 'onThreshold5'].includes(dep.field)) {
        fieldValue = 'effect:' + value;
        oldFieldValue = 'effect:' + dep.value;
      }
    }
    return `UPDATE ${dep.table} SET ${fieldName} = '${fieldValue}' WHERE ${fieldName} = '${oldFieldValue}' ${
      dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
    }`;
  }

  private deleteRecords(dep: UsageModel): string {
    return `DELETE FROM ${dep.table} WHERE ${dep.field} = '${dep.value}' ${
      dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
    }`;
  }

  private async deleteInStrings(dep: UsageModel): Promise<string[]> {
    const result = await this.databaseService.customQuery(
      this.getDBProfile(dep.dbType),
      `SELECT ${dep.field} as multipleItems FROM ${dep.table} WHERE 1 = 1 ${
        dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
      }`,
    );
    const sqls = [];
    let separator = ';';
    if (dep.field === 'startsQuests' || dep.field === 'endsQuests' || dep.field === 'startsDialogues') {
      separator = ',';
    }
    if (result) {
      for (const row of result) {
        if (row.multipleItems.split(separator).includes('' + dep.value)) {
          const multipleItems = row.multipleItems
            .split(separator)
            .filter((item: string) => item !== '' + dep.value)
            .join(separator);
          sqls.push(
            `UPDATE ${dep.table} SET ${dep.field} = '${multipleItems}' WHERE ${dep.field} = '${row.multipleItems}' ${
              dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
            }`,
          );
        }
      }
    }
    return sqls;
  }

  private updateByDefaults(dep: UsageModel): string {
    let defaultValue = '-1';
    if (dep.defaultValue) {
      defaultValue = dep.defaultValue;
    }
    return `UPDATE ${dep.table} SET ${dep.field} = '${defaultValue}' WHERE ${dep.field} = '${dep.value}' ${
      dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
    }`;
  }

  private updateByEmpty(dep: UsageModel): string {
    let defaultValue: string | number = 'empty';
    if (
      [
        'reagentRequired',
        'reagent2Required',
        'reagent3Required',
        'pulseReagentRequired',
        'pulseReagent2Required',
        'pulseReagent3Required',
      ].includes(dep.field)
    ) {
      defaultValue = 'minus_one';
    }
    let oldFieldValue = dep.value;
    if (
      dep.table === statsTable &&
      ['onThreshold', 'onThreshold2', 'onThreshold3', 'onThreshold4', 'onThreshold5'].includes(dep.field)
    ) {
      oldFieldValue = 'effect:' + dep.value;
    }
    if (defaultValue === 'empty') {
      return `UPDATE ${dep.table} SET ${dep.field} = '' WHERE ${dep.field} = '${oldFieldValue}' ${
        dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
      }`;
    }
    return `UPDATE ${dep.table} SET ${dep.field} = -1 WHERE ${dep.field} = '${oldFieldValue}' ${
      dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
    }`;
  }

  private clearFieldSet(dep: UsageModel): string {
    if (dep.tableType === TabTypes.ITEMS) {
      const numberValue = dep.field.replace(/[^0-9]/g, '');
      if (numberValue && dep.options && dep.options?.length > 0) {
        return `UPDATE ${
          dep.table
        } SET effect${numberValue}type = '', effect${numberValue}name = '', effect${numberValue}value = '' WHERE 1 = 1 AND ${dep.options.join(
          ' AND ',
        )} AND ${dep.field} = '${dep.value}'`;
      }
    } else if (dep.tableType === TabTypes.ITEM_SETS || dep.tableType === TabTypes.ENCHANT_PROFILE) {
      const numberValue = dep.field.replace(/[^0-9]/g, '');
      if (numberValue) {
        return `UPDATE ${
          dep.table
        } SET effect${numberValue}name = '', effect${numberValue}value = 0, effect${numberValue}valuep = 0 WHERE 1 = 1 AND ${
          dep.options ? dep.options.join(' AND ') + ' AND ' : ''
        } ${dep.field} = '${dep.value}'`;
      }
    }
    return '';
  }

  private async prepareDeps(currentDeps: UsageModel[]): Promise<UsageModel[]> {
    const deps: UsageModel[] = [];
    for (const dep of currentDeps) {
      if (dep.usageType === UsageType.change) {
        deps.push(dep);
      } else if (
        !deps.filter((d) => d.tableType === dep.tableType && d.section === dep.section && d.usageType === dep.usageType)
          .length
      ) {
        deps.push(dep);
      } else {
        const item = deps.find(
          (d) => d.tableType === dep.tableType && d.section === dep.section && d.usageType === dep.usageType,
        );
        if (item) {
          if (!item.count) {
            item.count = 0;
          }
          item.count += dep.count as number;
        }
      }
    }
    for (const dep of deps) {
      if (dep.usageType === UsageType.change) {
        const fieldName = dep.table + '_' + dep.field;
        const label = dep.tableType.toUpperCase() + '.' + dep.field.toUpperCase();

        let fieldConfig = dep.fieldConfig;
        let allowNew = !!dep.fieldConfig;
        if (
          dep.tableType === TabTypes.ITEMS &&
          dep.table === itemTemplatesTable &&
          dep.field === 'slot' &&
          dep.fieldConfig
        ) {
          allowNew = false;
          let dropdownData: DropdownValue[] = [];
          if (dep.fieldConfig.table === slotsTable) {
            const currentRow = await this.databaseService.customQuery(
              this.getDBProfile(DataBaseType.world_content),
              `SELECT type FROM ${dep.fieldConfig.table} WHERE isactive = 1 AND name = ?`,
              [dep.value as string],
            );
            if (currentRow.length > 0 && currentRow[0].type) {
              const optionChoice = await this.databaseService.customQuery(
                this.getDBProfile(DataBaseType.world_content),
                `SELECT choice FROM editor_option_choice where id = ${currentRow[0].type}`,
              );
              if (optionChoice.length > 0 && optionChoice[0].choice) {
                dropdownData = await this.dropdownItemService.getSlotNamesByType(optionChoice[0].choice);
              }
            }
          } else if (dep.fieldConfig.table === slotsGroupTable) {
            const response = await this.databaseService.customQuery(
              this.getDBProfile(DataBaseType.world_content),
              `SELECT id, name FROM ${slotsTable} WHERE isactive = 1 UNION SELECT id, name FROM ${slotsGroupTable} WHERE isactive = 1`,
            );
            dropdownData = response.map((item: any) => ({id: item.name, value: item.name}));
          }
          fieldConfig = {
            isData: true,
            data: dropdownData,
          };
        }
        dep.formField = {
          name: fieldName,
          label: this.translate.instant(dep.label ?? label),
          tooltip: this.translate.instant((dep.label ?? label) + '_HELP'),
          type: FormFieldType.dynamicDropdown,
          allowNew,
          require: true,
          fieldConfig,
          multiple: !!dep.multiple,
        };
        if (!dep.value) {
          dep.value = '';
        }
        this.form.addControl(
          fieldName,
          new FormControl(null, [Validators.required.bind(Validators), usedItemValidator(dep.value)]),
        );
      }
    }
    return deps;
  }
}
