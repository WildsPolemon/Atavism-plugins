import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {ConfigRow, DynamicDropdownFieldConfig, Operators} from 'app/models/configRow.interface';
import {fuseAnimations} from '@fuse/animations';
import {CompareQuery, QueryParams, TableConfig, TypeMap, WhereQuery} from '../../../models/configs';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged, startWith} from 'rxjs/operators';
import {TabTypes} from '../../../models/tabTypes.enum';

@Component({
  selector: 'atv-table-search',
  templateUrl: './table-search.component.html',
  styleUrls: ['./table-search.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})
export class TableSearchComponent implements OnInit {
  @Input() public tableConfig!: TableConfig;
  @Output() public paramsUpdated: EventEmitter<QueryParams> = new EventEmitter();
  public searchInput = new FormControl('');
  public allVisible = false;
  public clearFilters = false;
  private firstEmit = true;

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.searchInput.valueChanges.pipe(startWith(''), distinctUntilChanged(), debounceTime(250)).subscribe((query) => {
      this.tableConfig.queryParams.search = query;
      if (!this.firstEmit) {
        this.paramsUpdated.emit(this.tableConfig.queryParams);
      }
      this.firstEmit = false;
    });
  }

  public get filters(): string[] {
    return Object.keys(this.tableConfig.fields)
      .filter((key) => this.tableConfig.fields[key].filterVisible)
      .map((key) => key);
  }

  public filter(filterName: string): ConfigRow {
    return this.tableConfig.fields[filterName];
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public onFilterSelect(value: any, filterName: string): void {
    if (this.tableConfig.type === TabTypes.DIALOGUE && filterName === 'action') {
      delete (this.tableConfig.queryParams.where as WhereQuery).actionID;
      this.tableConfig.fields.actionID.overrideValue = -1;
      this.tableConfig.fields.actionID.fieldConfig = undefined;
      if (value) {
        this.tableConfig.fields.actionID.fieldConfig =
          (this.tableConfig.fields.action.relatedFieldData as TypeMap<string, DynamicDropdownFieldConfig>)[value];
      }
    }
    if (this.tableConfig.type === TabTypes.DIALOGUE && filterName === 'actionID') {
      this.tableConfig.fields.actionID.overrideValue = value;
    }
    if (value === '-1') {
      delete (this.tableConfig.queryParams.where as WhereQuery)[filterName];
    } else {
      if (!this.tableConfig.queryParams.where) {
        this.tableConfig.queryParams.where = {};
      }
      this.tableConfig.queryParams.where[filterName] = value;
    }
    this.paramsUpdated.emit(this.tableConfig.queryParams);
  }

  public onFilterNumber(obj: {operator: Operators; value: number | string}, filterName: string): void {
    if (obj.value === '') {
      delete (this.tableConfig.queryParams.compare as CompareQuery)[filterName];
    } else {
      if (!this.tableConfig.queryParams.compare) {
        this.tableConfig.queryParams.compare = {};
      }
      this.tableConfig.queryParams.compare[filterName] = {operator: obj.operator, value: +obj.value};
    }
    this.paramsUpdated.emit(this.tableConfig.queryParams);
  }

  public clearQueryParams(): void {
    this.clearFilters = true;
    this.searchInput.patchValue('');
    this.tableConfig.queryParams.where = {};
    this.tableConfig.queryParams.compare = {};
    this.paramsUpdated.emit({...this.tableConfig.queryParams});
    setTimeout(() => {
      this.clearFilters = false;
      this.changeDetectorRef.markForCheck();
    });
  }
}
