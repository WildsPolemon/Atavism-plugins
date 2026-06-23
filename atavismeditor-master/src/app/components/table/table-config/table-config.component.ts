import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {FuseSidebarService} from '@fuse/components/sidebar/sidebar.service';
import {TableConfig} from '../../../models/configs';
import {FuseSidebarComponent} from '@fuse/components/sidebar/sidebar.component';

@Component({
  selector: 'atv-table-config',
  templateUrl: './table-config.component.html',
  styleUrls: ['./table-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TableConfigComponent implements OnInit {
  @Input() public tableConfig!: TableConfig;
  @Output() public configUpdate = new EventEmitter<TableConfig>();

  public configKeys: string[] = [];
  public tableFilters: string[] = [];
  public configTableColumnsKeys: string[] = [];
  private openedSidebar = false;
  private tableConfigClone: Record<string, {visible: boolean; filterVisible: boolean}> = {};

  constructor(private fuseSidebarService: FuseSidebarService, private readonly changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.configKeys = Object.keys(this.tableConfig.fields);
    this.tableFilters = this.configKeys.filter((key) => this.tableConfig.fields[key].filterType);
    this.configTableColumnsKeys = this.configKeys.filter((key) => !this.tableConfig.fields[key].alwaysVisible);
    this.changeDetectorRef.markForCheck();
  }

  public toggleSidebar(): void {
    const sidebar = this.fuseSidebarService.getSidebar(
      this.tableConfig.type + '-table-config-sidebar',
    ) as FuseSidebarComponent;
    if (!this.openedSidebar) {
      sidebar.open();
      this.openedSidebar = true;
      this.changeDetectorRef.markForCheck();
    } else {
      sidebar.close();
      this.openedSidebar = false;
      Object.keys(this.tableConfigClone).forEach((key) => {
        this.tableConfig.fields[key].visible = this.tableConfigClone[key].visible;
        this.tableConfig.fields[key].filterVisible = this.tableConfigClone[key].filterVisible;
      });
      this.configUpdate.emit(this.tableConfig);
      this.changeDetectorRef.markForCheck();
    }
  }

  public toggleColumnVisibility(event: MatCheckboxChange, key: string): void {
    if (!this.tableConfigClone[key]) {
      this.tableConfigClone[key] = {
        visible: this.tableConfig.fields[key].visible,
        filterVisible: this.tableConfig.fields[key].filterVisible as boolean,
      };
    }
    this.tableConfigClone[key].visible = event.checked;
  }

  public toggleFilters(event: MatCheckboxChange, key: string): void {
    if (!this.tableConfigClone[key]) {
      this.tableConfigClone[key] = {
        visible: this.tableConfig.fields[key].visible,
        filterVisible: this.tableConfig.fields[key].filterVisible as boolean,
      };
    }
    this.tableConfigClone[key].filterVisible = event.checked;
  }
}
