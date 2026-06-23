import {Injectable, OnDestroy} from '@angular/core';
import {DataBaseProfile, DataBaseType} from '../settings/profiles/profile';
import {Connection, MysqlError} from 'mysql';
import {LogService} from '../logs/log.service';
import {QueryParams, TableFields, WhereQuery} from '../models/configs';
import {
  enchantProfileTable,
  itemTemplatesTable,
  spawnDataTable,
  statsTable,
  statThresholdTable,
} from '../entry/tables.data';
import {ConfigTypes} from '../models/configRow.interface';
import {NotificationService} from './notification.service';
import {TranslateService} from '@ngx-translate/core';
import * as moment from 'moment';
import {SubQueryField, SubTable} from '../entry/sub-form.service';
import {ElectronService} from './electron.service';

const poolsOptions = {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export interface UsageInterface {
  profile: DataBaseProfile;
  table?: string;
  field?: string;
  value?: string | number;
  options?: string[];
  multiple?: boolean;
  isQuery?: boolean;
  query?: string;
}

export interface ListResponse {
  count: number;
  list: any[];
}

@Injectable({
  providedIn: 'root',
})
export class DatabaseService implements OnDestroy {
  private pool: Record<DataBaseType, any> = {
    [DataBaseType.admin]: undefined,
    [DataBaseType.atavism]: undefined,
    [DataBaseType.master]: undefined,
    [DataBaseType.world_content]: undefined,
  };
  private mysql: any;

  constructor(
    private readonly logs: LogService,
    private readonly translate: TranslateService,
    private readonly notification: NotificationService,
    private readonly electronService: ElectronService,
  ) {
    try {
      this.mysql = this.electronService.remote.require('mysql2');
    } catch (error) {
      this.mysql = undefined;
      this.notification.error(error.toString());
      this.logs.error('[DatabaseService.constructor]', error);
    }
  }

  public clearPool(): void {
    Object.keys(this.pool).forEach((poolKey) => {
      try {
        if (this.pool[poolKey]) {
          this.pool[poolKey].end(() => {
            this.pool[poolKey] = undefined;
          });
        }
      } catch (e) {
        this.pool[poolKey] = undefined;
      }
    });
  }

  public async queryList<T>(
    dbProfile: DataBaseProfile,
    table: string,
    fields: TableFields,
    queryParams: QueryParams,
    searchSubQuery = '',
    additionalColumn: string[] = [],
    leftJoin = '',
    distinct = false,
  ): Promise<ListResponse> {
    const pool = this.getPool(dbProfile);
    return new Promise((resolve, reject) => {
      const params = this.parseParams(fields, queryParams);
      let selectString = 'mt.*';
      let selectCountString = '*';
      let groupBy = '';
      if (distinct) {
        if (table === statThresholdTable) {
          selectString = 'distinct stat_function';
          selectCountString = 'distinct stat_function';
        } else {
          groupBy = ' GROUP BY id, Name, isactive ';
          selectString =
            'distinct id, Name, isactive, max(creationtimestamp) as creationtimestamp, max(updatetimestamp) as updatetimestamp';
          selectCountString = 'distinct id, Name, isactive';
        }
      }
      pool.query(
        `SELECT count(${selectCountString}) as count FROM ${table} AS mt ${params.whereString} ${searchSubQuery}`,
        (error: MysqlError, result: any) => {
          if (error) {
            this.notification.error(error.toString());
            this.logs.error('[DatabaseService.queryList]', [error.sql, error.sqlMessage]);
            reject(error);
            return;
          }
          const count = +result[0].count;
          pool.query(
            `
          SELECT ${selectString} ${additionalColumn.length > 0 ? ', ' + additionalColumn.join(', ') : ''}
          FROM ${table} AS mt
          ${leftJoin}
          ${params.whereString} ${searchSubQuery}
          ${groupBy}
          ${params.order} ${params.limit}
        `,
            (error1: MysqlError, result1: any) => {
              if (error1) {
                this.notification.error(error1.toString());
                this.logs.error('[DatabaseService.queryList]', [error1.sql, error1.sqlMessage]);
                reject(error1);
              }
              resolve({
                count,
                list: result1 as T[],
              });
            },
          );
        },
      );
    });
  }

  public async queryAll<T>(
    dbProfile: DataBaseProfile,
    table: string,
    fields: TableFields,
    queryParams: Partial<QueryParams>,
    subQuery?: string,
  ): Promise<T[]> {
    const connection = this.getPool(dbProfile);
    return new Promise((resolve, reject) => {
      const params = this.parseParams(fields, queryParams);
      connection.query(
        `SELECT * ${subQuery ? subQuery : ''} FROM ${table} ${params.whereString} ${params.order}`,
        (error: MysqlError, result: T[]) => {
          if (error) {
            this.notification.error(error.toString());
            this.logs.error('[DatabaseService.queryAll]', [error.sql, error.sqlMessage]);
            reject(error);
          }
          resolve(result);
        },
      );
    });
  }

  public async queryItem<T>(dbProfile: DataBaseProfile, table: string, field: string, id: number | string): Promise<T> {
    const connection = this.getPool(dbProfile);
    return new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM ?? WHERE ?? = ?`, [table, field, id], (error: MysqlError | null, result: any) => {
        if (error) {
          this.notification.error(error.toString());
          this.logs.error('[DatabaseService.queryItem]', [error.sql, error.sqlMessage]);
          reject(error);
        }
        resolve(result[0] ? result[0] : null);
      });
    });
  }

  public async queryDropdownList(
    dbProfile: DataBaseProfile,
    table: string,
    fields: TableFields,
    queryParams: QueryParams,
  ): Promise<ListResponse> {
    const connection = this.getPool(dbProfile);
    return new Promise((resolve, reject) => {
      const params = this.parseParams(fields, queryParams);
      const fieldsList = Object.keys(fields);
      let selectString = fieldsList.length > 0 ? fieldsList.join(', ') : ' * ';
      let selectCountString = '*';
      if (table === enchantProfileTable) {
        selectString = 'distinct id, Name';
        selectCountString = 'distinct id, Name';
      }
      connection.query(
        `SELECT count(${selectCountString}) as count FROM ${table} ${params.whereString}`,
        (error: MysqlError, result: any) => {
          if (error) {
            this.notification.error(error.toString());
            this.logs.error('[DatabaseService.queryDropdownList]', [error.sql, error.sqlMessage]);
            reject(error);
          }
          const count = +result[0].count;
          connection.query(
            `SELECT ${selectString} FROM ${table} ${params.whereString} ${params.limit}`,
            (error1: MysqlError, result1: any) => {
              if (error1) {
                this.notification.error(error1.toString());
                this.logs.error('[DatabaseService.queryDropdownList]', [error1.sql, error1.sqlMessage]);
                reject(error1);
              }
              resolve({
                count,
                list: result1,
              });
            },
          );
        },
      );
    });
  }

  public async insert<T>(
    dbProfile: DataBaseProfile,
    table: string,
    record: Partial<T>,
    notify = true,
  ): Promise<number> {
    const connection = this.getPool(dbProfile);
    return new Promise((resolve, reject) => {
      connection.query(`INSERT INTO ${table} SET ?`, record, (error: MysqlError | null, results: any) => {
        if ('icon2' in record) {
          // @ts-ignore
          record.icon2 = '_replaced_for_logs_';
        }
        this.logs.log('[DatabaseService.insert]', [`INSERT INTO ${table} SET ?`, record, results]);
        if (error) {
          this.notification.error(error.toString());
          this.logs.error('[DatabaseService.insert]', [error.sql, error.sqlMessage]);
          reject(error);
        } else {
          if (notify) {
            this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_ADDED'));
          }
          resolve(results.insertId);
        }
      });
    });
  }

  public async update<T>(
    dbProfile: DataBaseProfile,
    table: string,
    record: T,
    main: string,
    id: number | string,
  ): Promise<any> {
    const connection = this.getPool(dbProfile);
    return new Promise((resolve, reject) => {
      if (!connection) {
        reject('Connection error');
      }
      const fields = Object.keys(record).map((key) => `${key} = ?`);
      const values = Object.values(record);
      values.push(id);
      connection.query(
        `UPDATE ${table} SET ${fields.join(', ')} WHERE ${main} = ?`,
        values,
        (error: MysqlError | null, results: any) => {
          if ('icon2' in record) {
            // @ts-ignore
            record.icon2 = '_replaced_for_logs_';
          }
          this.logs.log('[DatabaseService.update]', [
            `UPDATE ${table} SET ${fields.join(', ')} WHERE ${main} = ?`,
            values,
            results,
          ]);
          if (error) {
            this.notification.error(error.toString());
            this.logs.error('[DatabaseService.update]', [error.sql, error.sqlMessage]);
            reject(error);
          } else {
            resolve(results);
          }
        },
      );
    });
  }

  public async delete(
    dbProfile: DataBaseProfile,
    table: string,
    main: string,
    id: number | string,
    notify = true,
  ): Promise<void> {
    const connection = this.getPool(dbProfile);
    return new Promise((resolve, reject) => {
      connection.query(`DELETE FROM ${table} WHERE ${main} = ?`, [id], (error: MysqlError | null, results: any) => {
        this.logs.log('[DatabaseService.delete]', [`DELETE FROM ${table} WHERE ${main} = ?`, [id], results]);
        if (error) {
          this.notification.error(error.toString());
          this.logs.error('[DatabaseService.delete]', [error.sql, error.sqlMessage]);
          reject(error);
        }
        if (notify) {
          this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_REMOVED'));
        }
        resolve();
      });
    });
  }

  public async customQuery(
    dbProfile: DataBaseProfile,
    query: string,
    params: any[] = [],
    addLog = false,
  ): Promise<any> {
    const connection = this.getPool(dbProfile);
    return new Promise((resolve, reject) => {
      params.map((param) => {
        let newParam = connection.escape(param);
        /* tslint:disable */
        if (newParam.length > 2 && newParam[0] === "'" && newParam[newParam.length] === "'") {
          newParam = newParam.substring(0, newParam.length - 1);
          newParam = newParam.substr(1);
        }
        /* tslint:enable */
        return newParam;
      });
      connection.query(query, params, (error: MysqlError | null, result: any) => {
        if (addLog) {
          this.logs.log('[DatabaseService.customQuery]', [query, params]);
        }
        if (error) {
          this.logs.error('[DatabaseService.customQuery]', [error.sql, error.sqlMessage]);
          this.notification.error(error.toString());
          reject(error);
        }
        resolve(result);
      });
    });
  }

  public async transactionQueries(dbProfile: DataBaseProfile, queries: string[]): Promise<void> {
    const pool = this.getPool(dbProfile);
    return new Promise((resolve, reject) => {
      pool.getConnection((error: MysqlError, connection: any) => {
        if (error) {
          this.notification.error(error.toString());
          this.logs.error('[DatabaseService.transactionQueries]', [error.sql, error.sqlMessage]);
          reject(error);
        }
        connection.beginTransaction((error2: MysqlError) => {
          if (error2) {
            this.notification.error(error2.toString());
            this.logs.error('[DatabaseService.transactionQueries]', [error2.sql, error2.sqlMessage]);
            reject(error2);
          }
          this.recQuery(connection, queries, 0)
            .then(() => {
              connection.commit((err: MysqlError) => {
                if (err) {
                  return connection.rollback(() => {
                    this.notification.error(err.toString());
                    this.logs.error('[DatabaseService.transactionQueries]', [err.sql, err.sqlMessage]);
                    pool.releaseConnection(connection);
                    reject(err);
                  });
                }
                pool.releaseConnection(connection);
                resolve();
              });
            })
            .catch((error1) => {
              connection.rollback(() => {
                this.notification.error(error1.toString());
                this.logs.error('[DatabaseService.transactionQueries]', [error1.sql, error1.sqlMessage]);
                pool.releaseConnection(connection);
                reject(error1);
              });
            });
        });
      });
    });
  }

  public async checkDepUsage(usageItem: UsageInterface): Promise<number> {
    if (usageItem.multiple) {
      const result = await this.customQuery(
        usageItem.profile,
        `SELECT ${usageItem.field} as multipleItems FROM ${usageItem.table} WHERE 1 = 1 ${
          usageItem.options && usageItem.options.length > 0 ? ' AND ' + usageItem.options.join(' AND ') : ''
        }`,
      );
      let separator = ';';
      if (
        usageItem.field === 'startsQuests' ||
        usageItem.field === 'endsQuests' ||
        usageItem.field === 'startsDialogues'
      ) {
        separator = ',';
      } else if (
        usageItem.table === itemTemplatesTable &&
        usageItem.options &&
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
        ].includes(usageItem.options[0])
      ) {
        separator = '|';
      }
      if (result) {
        let count = 0;
        for (const row of result) {
          if (row.multipleItems.length > 0 && row.multipleItems.split(separator).includes('' + usageItem.value)) {
            count++;
          }
        }
        return count;
      }
    } else {
      let fieldName = usageItem.field;
      let fieldValue = usageItem.value;
      if (usageItem.table === statsTable) {
        if (usageItem.field === 'onMinHitEffect') {
          fieldName = 'onMinHit';
          fieldValue = 'effect:' + usageItem.value;
        } else if (usageItem.field === 'onMaxHitEffect') {
          fieldName = 'onMaxHit';
          fieldValue = 'effect:' + usageItem.value;
        } else if (
          ['onThreshold', 'onThreshold2', 'onThreshold3', 'onThreshold4', 'onThreshold5'].includes(
            usageItem.field as string,
          )
        ) {
          fieldValue = 'effect:' + usageItem.value;
        }
      }
      const result = await this.customQuery(
        usageItem.profile,
        `SELECT COUNT(*) as itemCount FROM ${usageItem.table} WHERE ?? = ? ${
          usageItem.options && usageItem.options.length > 0 ? ' AND ' + usageItem.options.join(' AND ') : ''
        }`,
        [fieldName, fieldValue],
      );
      if (result && +result[0].itemCount > 0) {
        return +result[0].itemCount;
      }
    }
    return 0;
  }

  public async checkUsage(usageItems: UsageInterface[]): Promise<{result: boolean; table: string}> {
    let usageResult = false;
    let table = '';
    try {
      for (const usageItem of usageItems) {
        if (!usageResult) {
          if (usageItem.multiple) {
            const result = await this.customQuery(
              usageItem.profile,
              `SELECT ${usageItem.field} as multipleItems FROM ${usageItem.table} WHERE 1 = 1 ${
                usageItem.options && usageItem.options.length > 0 ? ' AND ' + usageItem.options.join(' AND ') : ''
              }`,
            );
            if (result) {
              let separator = ';';
              if (
                usageItem.table === spawnDataTable &&
                (usageItem.field === 'startsQuests' || usageItem.field === 'endsQuests')
              ) {
                separator = ',';
              }
              for (const row of result) {
                if (!usageResult && row.multipleItems.split(separator).includes('' + usageItem.value)) {
                  usageResult = true;
                  table = usageItem.table as string;
                }
              }
            }
          } else {
            let result;
            if (usageItem.isQuery) {
              result = await this.customQuery(usageItem.profile, usageItem.query as string, usageItem.options);
            } else {
              result = await this.customQuery(
                usageItem.profile,
                `SELECT COUNT(*) as itemCount FROM ${usageItem.table} WHERE ?? = ? ${
                  usageItem.options && usageItem.options.length > 0 ? ' AND ' + usageItem.options.join(' AND ') : ''
                }`,
                [usageItem.field, usageItem.value],
              );
            }
            if (result && +result[0].itemCount > 0) {
              usageResult = true;
              table = usageItem.table as string;
            }
          }
        }
      }
      return {result: usageResult, table};
    } catch (e) {
      this.logs.error('[DatabaseService.checkUsage]', e);
      return {result: true, table};
    }
  }

  public getTimestampNow(): string {
    return moment().format('YYYY-MM-DD HH:mm:ss');
  }

  public buildSubQueries(
    fields: TableFields,
    queryParams: QueryParams,
    subFields: Record<string, SubQueryField>,
  ): {searchSubQuery: string; newQueryParams: QueryParams} {
    const subQueries: string[] = [];
    const {newQueryParams, subFields: newSubFields} = this.parseQueryParams(queryParams, subFields);
    Object.keys(newSubFields).forEach((key) => {
      const subField = newSubFields[key];
      if (
        (subField.where && Object.keys(subField.where).length > 0) ||
        (subField.compare && Object.keys(subField.compare).length > 0) ||
        (subField.orWhere && Object.keys(subField.orWhere).length > 0) ||
        (subField.orCompare && Object.keys(subField.orCompare).length > 0)
      ) {
        let useSubbing = true;
        if (
          subField.where &&
          Object.keys(subField.where).length === 1 &&
          subField.where.isactive !== undefined &&
          (!subField.compare || Object.keys(subField.compare).length === 0)
        ) {
          useSubbing = false;
        }
        if (useSubbing) {
          const params = this.parseParams(fields, {
            where: subField.where,
            compare: subField.compare,
            orWhere: subField.orWhere,
            orCompare: subField.orCompare,
            search: '',
          } as Partial<QueryParams>);
          subQueries.push(
            ` (${subField.main} in (SELECT ${subField.related} FROM ${subField.table} ${params.whereString})) `,
          );
        }
      }
    });
    if(subQueries.length > 0 && Object.keys(newQueryParams.where).length==0){
      newQueryParams.where['1']='1';
    }
    return {searchSubQuery: subQueries.length > 0 ? ' AND ' + subQueries.join(' AND ') : '', newQueryParams};
  }

  public testConnection(dbProfile: DataBaseProfile): Promise<{status: boolean; message: string}> {
    return new Promise((resolve) => {
      const pool = this.creatingPool(dbProfile);
      pool.getConnection((connectionError: MysqlError, connection: Connection) => {
        if (connectionError) {
          this.logs.error('[DatabaseService.testConnection]', [
            connectionError.code,
            connectionError.errno,
            connectionError.sqlMessage,
          ]);
          resolve({status: false, message: connectionError.message});
          return;
        }
        connection.query('SELECT 1', (error: MysqlError) => {
          if (error) {
            this.logs.error('[DatabaseService.testConnection]', [error.code, error.errno, error.sqlMessage]);
            resolve({status: false, message: error.message});
            return;
          }
          pool.releaseConnection(connection);
          resolve({status: true, message: ''});
        });
      });
    });
  }

  private parseQueryParams(
    queryParams: QueryParams,
    subFields: Record<string, SubQueryField>,
  ): {newQueryParams: QueryParams; subFields: Record<string, SubQueryField>} {
    const newQueryParams: QueryParams = {
      search: queryParams.search,
      sort: queryParams.sort,
      limit: queryParams.limit,
      compare: {},
      where: {},
      orWhere: {},
      orCompare: {},
    };
    if (!queryParams.where) {
      queryParams.where = {};
    }
    if (!queryParams.compare) {
      queryParams.compare = {};
    }
    Object.keys(queryParams.where).forEach((key) => {
      if (subFields[key] !== undefined) {
        if (subFields[key].type === SubTable.multiple) {
          const whereList = [];
          // @ts-ignore
          for (const column of subFields[key].columns) {
            // @ts-ignore
            whereList.push(`${column} = '${(queryParams.where as WhereQuery)[key]}'`);
          }
          if (whereList.length > 0) {
            // @ts-ignore
            (newQueryParams.where as WhereQuery)[`(${whereList.join(' OR ')})`] = 'where_null_using';
          }
        } else if (subFields[key].type === SubTable.multiple_left_join) {
          if (!subFields[key].orWhere) {
            subFields[key].orWhere = {};
          }
          // @ts-ignore
          for (const column of subFields[key].columns) {
            // @ts-ignore
            subFields[key].orWhere[column] = (queryParams.where as WhereQuery)[key];
          }
        } else {
          if (!subFields[key].where) {
            subFields[key].where = {};
          }
          // @ts-ignore
          subFields[key].where[key] = (queryParams.where as WhereQuery)[key];
        }
      } else {
        // @ts-ignore
        (newQueryParams.where as WhereQuery)[key] = (queryParams.where as WhereQuery)[key];
      }
    });
    Object.keys(queryParams.compare).forEach((key) => {
      if (subFields[key] !== undefined) {
        if (subFields[key].type === SubTable.multiple) {
          const whereList = [];
          // @ts-ignore
          for (const column of subFields[key].columns) {
            // @ts-ignore
            const search = queryParams.compare[key];
            whereList.push(`${column} ${search.operator} ${search.value}`);
          }
          if (whereList.length > 0) {
            // @ts-ignore
            (newQueryParams.where as WhereQuery)[`(${whereList.join(' OR ')})`] = 'where_null_using';
          }
        } else if (subFields[key].type === SubTable.multiple_left_join) {
          if (!subFields[key].orCompare) {
            subFields[key].orCompare = {};
          }
          // @ts-ignore
          for (const column of subFields[key].columns) {
            // @ts-ignore
            subFields[key].orCompare[column] = queryParams.compare[key];
          }
        } else {
          if (!subFields[key].compare) {
            subFields[key].compare = {};
          }
          // @ts-ignore
          subFields[key].compare[key] = queryParams.compare[key];
        }
      } else {
        // @ts-ignore
        newQueryParams.compare[key] = queryParams.compare[key];
      }
    });
    return {newQueryParams, subFields};
  }

  private getPool(dbProfile: DataBaseProfile) {
    try {
      const poolKey = `${dbProfile.type}_${dbProfile.database}_${dbProfile.password}`;
      if (this.pool[poolKey]) {
        return this.pool[poolKey];
      }
      this.pool[poolKey] = this.creatingPool(dbProfile);
      return this.pool[poolKey];
    } catch (error) {
      this.logs.error('[DatabaseService.connection]', [error.code, error.errno, error.sqlMessage]);
      throw error;
    }
  }

  private creatingPool(dbProfile: DataBaseProfile) {
    if(this.mysql === undefined){
      this.mysql = this.electronService.remote.require('mysql2');
    }
    return this.mysql.createPool({
      database: String(dbProfile.database),
      host: String(dbProfile.host),
      password: String(dbProfile.password),
      port: String(dbProfile.port),
      user: String(dbProfile.user),
      ...poolsOptions,
    });
  }

  private parseParams(
    fields: TableFields,
    {compare, limit, orCompare, orWhere, search, sort, where}: Partial<QueryParams>,
  ): {whereString: string; order: string; limit: string} {
    const wheres = [];
    if (where) {
      Object.keys(where).forEach((field: string) => {
        const value = where[field];
        if (fields[field] && fields[field].type === ConfigTypes.date) {
          wheres.push(`DATE(${field}) = '${value}'`);
        } else if (value === 'where_null_using') {
          wheres.push(`${field}`);
        } else {
          wheres.push(`${field} = '${value}'`);
        }
      });
    }
    if (compare && Object.keys(compare).length > 0) {
      Object.keys(compare).forEach((field) => {
        wheres.push(`${field} ${compare[field].operator} ${compare[field].value}`);
      });
    }
    if (search && search.length > 0) {
      const whereSearch: string[] = [];
      Object.keys(fields)
        .filter((field) => fields[field].useAsSearch)
        .forEach((field) => {
          whereSearch.push(`${field} LIKE ${this.mysql.escape('%' + search + '%')}`);
        });
      wheres.push('(' + whereSearch.join(' OR ') + ')');
    }
    if (orWhere && Object.keys(orWhere).length > 0) {
      const orWheres: string[] = [];
      Object.keys(orWhere).forEach((field) => {
        const value = orWhere[field];
        if (fields[field] && fields[field].type === ConfigTypes.date) {
          orWheres.push(`DATE(${field}) = '${value}'`);
        } else if (value === 'where_null_using') {
          orWheres.push(`${field}`);
        } else {
          orWheres.push(`${field} = '${value}'`);
        }
      });
      wheres.push('(' + orWheres.join(' OR ') + ')');
    }
    if (orCompare && Object.keys(orCompare).length > 0) {
      const orCompares: string[] = [];
      Object.keys(orCompare).forEach((field) => {
        orCompares.push(`${field} ${orCompare[field].operator} ${orCompare[field].value}`);
      });
      wheres.push('(' + orCompares.join(' OR ') + ')');
    }
    const whereString = wheres.length > 0 ? ` WHERE ${wheres.join(' AND ')}` : '';
    let order = '';
    if (sort && sort.field.length > 0) {
      order = `ORDER BY ${sort.field} ${sort.order ? sort.order : 'ASC'}`;
    }
    let limits = '';
    if (limit && limit.limit > 0) {
      limits = `LIMIT ${limit.limit}`;
      if (limit.page > 0) {
        limits += ` OFFSET ${limit.page * limit.limit}`;
      }
    }
    return {whereString, order, limit: limits};
  }

  private recQuery(connection: Connection, queries: string[], i: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      connection.query(queries[i], (error: MysqlError) => {
        if (error) {
          return connection.rollback(() => {
            this.logs.error('[DatabaseService.recQuery]', [error.sql, error.sqlMessage]);
            reject(error);
          });
        }
        this.logs.log('[DatabaseService.recQuery]', [queries[i]]);
        if (queries[i + 1]) {
          return this.recQuery(connection, queries, i + 1)
            .then(() => resolve())
            .catch((error1) => {
              this.notification.error(error1.toString());
              this.logs.error('[DatabaseService.recQuery]', [error1.sql, error1.sqlMessage]);
              reject(error1);
            });
        } else {
          resolve();
        }
      });
    });
  }

  public ngOnDestroy(): void {
    Object.keys(this.pool).forEach((poolKey) => {
      if (this.pool[poolKey]) {
        this.pool[poolKey].getConnection((_: any, conn: any) => {
          this.pool[poolKey].releaseConnection(conn);
        });
      }
    });
  }
}
