import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {FormFieldConfig} from '../../../../models/configs';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {SubFormService, TableTooltip} from '../../../../entry/sub-form.service';
import {PopoverDirective} from 'ngx-smart-popover';

@Component({
  selector: 'atv-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextAreaComponent implements OnInit, OnDestroy {
  @ViewChild(PopoverDirective) public popover?: PopoverDirective;
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup;
  @Input() public field!: FormFieldConfig;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public errors: string[] = [];
  public disableTooltip = true;
  private destroyer = new Subject();

  constructor(private readonly subFormService: SubFormService, private readonly changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.subFormService.showTooltips
      .pipe(
        filter(() => !!this.tableType),
        map(
          (tables: TableTooltip[]) =>
            tables.find((item: TableTooltip) => item.table === this.tableType) as TableTooltip,
        ),
        filter((tableTooltip: TableTooltip) => !!tableTooltip),
        map((tableTooltip: TableTooltip) => tableTooltip.value),
        takeUntil(this.destroyer),
      )
      .subscribe((showTooltip) => {
        this.disableTooltip = !showTooltip;
        this.changeDetectorRef.markForCheck();
      });
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
