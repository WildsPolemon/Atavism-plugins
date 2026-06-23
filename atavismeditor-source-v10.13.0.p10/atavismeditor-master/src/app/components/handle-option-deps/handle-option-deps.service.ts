import {Injectable} from '@angular/core';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {Subject} from 'rxjs';
import {getProfilePipe} from '../../directives/utils';
import {MatDialog} from '@angular/material/dialog';
import {LoadingService} from '../loading/loading.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DatabaseService} from '../../services/database.service';
import {optionDependencies, sensitiveOption, UsageOptionModel} from './handle-option-deps.data';
import {MatDialogRef} from '@angular/material/dialog/dialog-ref';
import {HandleOptionDepsComponent} from './handle-option-deps.component';
import {DialogConfig} from '../../models/configs';
import {EditorOption, EditorOptionChoice} from '../../entry/option-choices/option-choices.data';
import {TablesService} from '../../services/tables.service';
import {itemTemplatesTable} from '../../entry/tables.data';

@Injectable({
  providedIn: 'root',
})
export class HandleOptionDepsService {
  private profile!: Profile;
  private destroyer = new Subject<void>();

  constructor(
    private readonly matDialog: MatDialog,
    private readonly loadingService: LoadingService,
    private readonly profilesService: ProfilesService,
    private readonly databaseService: DatabaseService,
    private readonly tablesService: TablesService,
  ) {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
    });
  }

  public async handleView(optionTypeID: number): Promise<boolean> {
    const profile = this.getDBProfile(DataBaseType.world_content);
    const record = await this.databaseService.queryItem<EditorOption>(profile, 'editor_option', 'id', optionTypeID);
    if (!record) {
      return false;
    }
    const deps = optionDependencies[record.optionType];
    if (!deps || !deps.length) {
      return true;
    }
    const options: EditorOptionChoice[] = await this.databaseService.customQuery(
      profile,
      `SELECT * FROM editor_option_choice WHERE isactive = 1 AND optionTypeID = ?`,
      [optionTypeID],
    );
    if (!options.length) {
      return true;
    }
    this.loadingService.show();
    const needActionDeps: Record<string, UsageOptionModel[]> = {};
    for (const option of options) {
      for (const dep of deps) {
        const depProfile = dep.dbType ? this.getDBProfile(dep.dbType) : this.getDBProfile(DataBaseType.world_content);
        let usedOption = dep.choiceAsId ? option.choice : option.id;
        if (dep.choiceIdAsI) {
          for (let i = 1; i <= options.length; i++) {
            const item = options[i - 1];
            if (item.choice === option.choice) {
              usedOption = i;
            }
          }
        }
        const result = await this.databaseService.checkDepUsage({
          profile: depProfile,
          table: dep.table,
          field: dep.field,
          value: usedOption,
          options: dep.options ?? [],
          multiple: !!dep.multiple,
        });
        if (result > 0) {
          const newDep = {...dep};
          newDep.value = usedOption;
          newDep.optionName = option.choice;
          newDep.count = result;
          if (!needActionDeps[usedOption]) {
            needActionDeps[usedOption] = [];
          }
          needActionDeps[usedOption].push(newDep);
        }
      }
    }
    if (Object.keys(needActionDeps).length > 0) {
      const dialogRef: MatDialogRef<HandleOptionDepsComponent> = this.matDialog.open(HandleOptionDepsComponent, {
        panelClass: DialogConfig.normalDialogOverlay,
        data: {
          deps: needActionDeps,
          record,
          type: 0,
        },
      });
      dialogRef
        .afterOpened()
        .toPromise()
        .then(() => {
          setTimeout(() => this.loadingService.hide(), 250);
        });
      const result = await dialogRef.afterClosed().toPromise();
      if (result) {
        this.tablesService.reloadActiveTabStream.next(void 0);
      }
      return result;
    } else {
      return true;
    }
  }

  public async handleEditedOptions(
    record: EditorOption,
    newOptions: EditorOptionChoice[],
    prevOptions: EditorOptionChoice[],
  ): Promise<boolean> {
    const deps = optionDependencies[record.optionType];
    if (!deps || !deps.length) {
      return true;
    }
    const updateOptions: EditorOptionChoice[] = [];
    const deleteOptions: EditorOptionChoice[] = [];
    let deleteMode = false;
    let updateMode = false;
    for (const prevOption of prevOptions) {
      const usedOption = newOptions.find(
        (newOption) => newOption.id === prevOption.id && newOption.choice === prevOption.choice,
      );
      if (!usedOption) {
        const usedOptionUpdated = newOptions.find((newOption) => newOption.id === prevOption.id);
        if (usedOptionUpdated) {
          updateMode = true;
          updateOptions.push(prevOption);
        } else {
          deleteMode = true;
          deleteOptions.push(prevOption);
        }
      }
    }
    if (deleteMode && deleteOptions.length > 0) {
      const needActionDeps: Record<string, UsageOptionModel[]> = {};
      for (const option of deleteOptions) {
        for (const dep of deps) {
          const {result, usedOption} = await this.checkDep(dep, option, prevOptions);
          if (result > 0) {
            const newDep = {...dep};
            newDep.value = usedOption;
            newDep.optionName = option.choice;
            newDep.count = result;
            if (!needActionDeps[usedOption]) {
              needActionDeps[usedOption] = [];
            }
            needActionDeps[usedOption].push(newDep);
          }
        }
      }
      if (Object.keys(needActionDeps).length > 0) {
        const dialogRef: MatDialogRef<HandleOptionDepsComponent> = this.matDialog.open(HandleOptionDepsComponent, {
          panelClass: DialogConfig.normalDialogOverlay,
          data: {
            deps: needActionDeps,
            record,
            type: 1,
          },
        });
        dialogRef.afterOpened().subscribe(() => {
          setTimeout(() => this.loadingService.hide(), 250);
        });
        const res = await dialogRef.afterClosed().toPromise();
        if (!res) {
          return false;
        }
      }
    }
    if (updateMode && updateOptions.length > 0 && sensitiveOption.includes(record.optionType)) {
      const executeWorldContentList = [];
      for (const option of updateOptions) {
        for (const dep of deps) {
          const {result, usedOption} = await this.checkDep(dep, option, prevOptions);
          if (result) {
            const newChoice = newOptions.find((newOption) => newOption.id === option.id);
            if (newChoice) {
              let forUseOption = dep.choiceAsId ? newChoice.choice : newChoice.id;
              if (dep.choiceIdAsI) {
                for (let i = 1; i <= newOptions.length; i++) {
                  const item = newOptions[i - 1];
                  if (item.choice === option.choice) {
                    forUseOption = i;
                  }
                }
              }
              if (!dep.dbType || dep.dbType === DataBaseType.world_content) {
                dep.dbType = DataBaseType.world_content;
                if (dep.multiple) {
                  const result2 = await this.databaseService.customQuery(
                    this.getDBProfile(dep.dbType),
                    `SELECT ${dep.field} as multipleItems FROM ${dep.table} WHERE 1 = 1 ${
                      dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
                    }`,
                  );
                  if (result2) {
                    let separator = ';';
                    if (dep.field === 'startsQuests' || dep.field === 'endsQuests' || dep.field === 'startsDialogues') {
                      separator = ',';
                    } else if (
                      dep.table === itemTemplatesTable &&
                      dep.options &&
                      [
                        `effect1type = 'Bonus'`,
                        `effect2type = 'Bonus'`,
                        `effect3type = 'Bonus'`,
                        `effect4type = 'Bonus'`,
                        `effect5type = 'Bonus'`,
                        `effect6type = 'Bonus'`,
                        `effect7type = 'Bonus'`,
                        `effect8type = 'Bonus'`,
                        `effect9type = 'Bonus'`,
                        `effect10type = 'Bonus'`,
                        `effect11type = 'Bonus'`,
                        `effect12type = 'Bonus'`,
                        `effect13type = 'Bonus'`,
                        `effect14type = 'Bonus'`,
                        `effect15type = 'Bonus'`,
                        `effect16type = 'Bonus'`,
                        `effect17type = 'Bonus'`,
                        `effect18type = 'Bonus'`,
                        `effect19type = 'Bonus'`,
                        `effect20type = 'Bonus'`,
                        `effect21type = 'Bonus'`,
                        `effect22type = 'Bonus'`,
                        `effect23type = 'Bonus'`,
                        `effect24type = 'Bonus'`,
                        `effect25type = 'Bonus'`,
                        `effect26type = 'Bonus'`,
                        `effect27type = 'Bonus'`,
                        `effect28type = 'Bonus'`,
                        `effect29type = 'Bonus'`,
                        `effect30type = 'Bonus'`,
                        `effect31type = 'Bonus'`,
                        `effect32type = 'Bonus'`,
                      ].includes(dep.options[0])
                    ) {
                      separator = '|';
                    }
                    for (const row of result2) {
                      let items = row.multipleItems.split(separator);
                      const oldValue = row.multipleItems;
                      if (items.indexOf(usedOption) !== -1) {
                        items = items.map((oldOption: string) => (oldOption === usedOption ? forUseOption : oldOption));
                        const newEffectValue = items.join(separator);
                        executeWorldContentList.push(
                          `UPDATE ${dep.table} SET ${dep.field} = '${newEffectValue}' WHERE ${
                            dep.field
                          } = '${oldValue}' ${
                            dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
                          }`,
                        );
                      }
                    }
                  }
                } else {
                  executeWorldContentList.push(
                    `UPDATE ${dep.table} SET ${dep.field} = '${forUseOption}' WHERE ${dep.field} = '${usedOption}' ${
                      dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''
                    }`,
                  );
                }
              }
            }
          }
        }
      }
      if (executeWorldContentList.length > 0) {
        const profile = this.getDBProfile(DataBaseType.world_content);
        await this.databaseService.transactionQueries(profile, executeWorldContentList);
      }
    }
    if (
      (deleteMode && deleteOptions.length > 0) ||
      (updateMode && updateOptions.length > 0 && sensitiveOption.includes(record.optionType))
    ) {
      this.tablesService.reloadActiveTabStream.next(void 0);
    }
    return true;
  }

  public destroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private async checkDep(
    dep: UsageOptionModel,
    option: EditorOptionChoice,
    options: EditorOptionChoice[] = [],
  ): Promise<{result: number; usedOption: string | number}> {
    const depProfile = dep.dbType ? this.getDBProfile(dep.dbType) : this.getDBProfile(DataBaseType.world_content);
    let usedOption = dep.choiceAsId ? option.choice : option.id;
    if (dep.choiceIdAsI) {
      for (let i = 1; i <= options.length; i++) {
        const item = options[i - 1];
        if (item.choice === option.choice) {
          usedOption = i;
        }
      }
    }
    return {
      result: await this.databaseService.checkDepUsage({
        profile: depProfile,
        table: dep.table,
        field: dep.field,
        value: usedOption,
        options: dep.options ?? [],
        multiple: !!dep.multiple,
      }),
      usedOption,
    };
  }

  private getDBProfile(type: DataBaseType): DataBaseProfile {
    return this.profile.databases.find((dbProfile) => dbProfile.type === type) as DataBaseProfile;
  }
}
