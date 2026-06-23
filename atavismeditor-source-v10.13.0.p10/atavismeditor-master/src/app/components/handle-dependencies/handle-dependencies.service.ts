import {Injectable} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {dependencies, UsageModel} from './handle-dependencies.data';
import {getProfilePipe} from '../../directives/utils';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {Subject} from 'rxjs';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../loading/loading.service';
import {DialogConfig} from '../../models/configs';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {HandleDependenciesComponent} from './handle-dependencies.component';
import {ActionTrigger} from '../../models/actions.interface';
import {effectsTable, itemTemplatesTable} from '../../entry/tables.data';

@Injectable({
  providedIn: 'root',
})
export class HandleDependenciesService {
  private profile!: Profile;
  private destroyer = new Subject<void>();

  constructor(
    private readonly matDialog: MatDialog,
    private readonly loadingService: LoadingService,
    private readonly profilesService: ProfilesService,
    private readonly databaseService: DatabaseService
  ) {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
    });
  }

  public async handleView(
    tableType: TabTypes,
    table: string,
    dbType: DataBaseType,
    field: string,
    action: ActionTrigger,
    name: string,
    special?: string
  ): Promise<boolean> {
    const deps = dependencies[tableType];
    if (!deps.length) {
      return false;
    }
    this.loadingService.show();
    const needActionDeps: UsageModel[] = [];
    for (const dep of deps) {
      if(!dep.checkNameInField) {
      let value = action.id;
      if (tableType === TabTypes.BONUS_SETTING && (dep.table === effectsTable || dep.table === itemTemplatesTable)) {
        value = special;
      }
      const result = await this.databaseService.checkDepUsage({
        profile: this.getDBProfile(dep.dbType),
        table: dep.table,
        field: dep.field,
        value,
        options: dep.options ?? [],
        multiple: !!dep.multiple,
      });
      if (result > 0) {
        const newDep = {...dep};
        newDep.value = value;
        newDep.count = result;
        needActionDeps.push(newDep);
      }
      }
    }
    if(name) {
      for (const dep of deps) {
        if(dep.checkNameInField) {
          let value = name;
          if (tableType === TabTypes.BONUS_SETTING && (dep.table === effectsTable || dep.table === itemTemplatesTable)) {
            value = special;
          }
          const result = await this.databaseService.checkDepUsage({
            profile: this.getDBProfile(dep.dbType),
            table: dep.table,
            field: dep.field,
            value,
            options: dep.options ?? [],
            multiple: !!dep.multiple,
          });
          if (result > 0) {
            const newDep = {...dep};
            newDep.value = value;
            newDep.count = result;
            needActionDeps.push(newDep);
          }
        }
      }
    }
    if (needActionDeps.length > 0) {
      const dialogRef: MatDialogRef<HandleDependenciesComponent> = this.matDialog.open(HandleDependenciesComponent, {
        panelClass: DialogConfig.normalDialogOverlay,
        data: {
          deps: needActionDeps,
          module: tableType,
          table,
          name,
          field,
          action,
          dbType,
        },
      });
      dialogRef
        .afterOpened()
        .toPromise()
        .then(() => {
          setTimeout(() => this.loadingService.hide(), 250);
        });
      return await dialogRef.afterClosed().toPromise();
    }
    return true;
  }

  public async updateRelatedValue(tableType: TabTypes, newValue: string, oldValue: string): Promise<boolean> {
    let deps = dependencies[tableType];
    if (!deps.length) {
      return false;
    }
    if (tableType === TabTypes.BONUS_SETTING) {
      deps = deps.filter(depItem => depItem.specialBonusEffect);
    }
    let anyUpdated = false;
    for (const dep of deps) {
      const result = await this.databaseService.checkDepUsage({
        profile: this.getDBProfile(dep.dbType),
        table: dep.table,
        field: dep.field,
        value: oldValue,
        options: dep.options ?? [],
        multiple: !!dep.multiple,
      });
      if (tableType === TabTypes.BONUS_SETTING) {
        if (dep.specialBonusEffect) {
          const number = dep.field.replace(/[^0-9]/g, '');
          const multipleResult = await this.databaseService.customQuery(this.getDBProfile(dep.dbType), `SELECT effect${number}value as multipleItems FROM ${dep.table} WHERE ${dep.field} = '${oldValue}' ${dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''}`);
          if (multipleResult) {
            const separator = '|';
            for (const row of multipleResult) {
              const items = row.multipleItems.split(separator);
              if (items[2]) {
                items[2] = newValue;
                const newEffectValue = items.join(separator);
                await this.databaseService.customQuery(this.getDBProfile(dep.dbType), `UPDATE ${dep.table} SET effect${number}value = '${newEffectValue}' WHERE ${dep.field} = '${oldValue}' ${dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''}`);
                anyUpdated = true;
              }
            }
          }
        }
      } else if (result) {
        await this.databaseService.customQuery(
          this.getDBProfile(dep.dbType),
          `UPDATE ${dep.table} SET ${dep.field} = ? WHERE ${dep.field} = ? ${dep.options && dep.options.length > 0 ? ' AND ' + dep.options.join(' AND ') : ''}`,
          [newValue, oldValue],
          true
        );
        anyUpdated = true;
      }
    }
    return anyUpdated;
  }

  public destroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private getDBProfile(type: DataBaseType): DataBaseProfile {
    return this.profile.databases.find((dbProfile) => dbProfile.type === type) as DataBaseProfile;
  }
}
