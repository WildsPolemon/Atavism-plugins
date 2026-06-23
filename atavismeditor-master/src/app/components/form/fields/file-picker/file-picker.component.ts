import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {AbstractControl, FormArray, FormGroup} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {DialogConfig, FormFieldConfig, FormFieldType} from '../../../../models/configs';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {FileManagerComponent} from '../../../../settings/file-manager/file-manager.component';
import {FileItem} from '../../../../settings/file-manager/file-manager.interfaces';
import {SubFormService, TableTooltip} from '../../../../entry/sub-form.service';
import {filter, map, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {DialogType} from '../../../../models/types';
import {ImageService} from '../../../image/image.service';

@Component({
  selector: 'atv-file-picker',
  templateUrl: './file-picker.component.html',
  styleUrls: ['./file-picker.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilePickerComponent implements OnInit, OnDestroy {
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup;
  @Input() public field!: FormFieldConfig;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public errors: string[] = [];
  public FormFieldType = FormFieldType;
  public disableTooltip = true;
  public formField: AbstractControl;
  private fileManagerDialogRef: DialogType<FileManagerComponent>;
  private destroyer = new Subject();

  constructor(
    private readonly matDialog: MatDialog,
    private readonly subFormService: SubFormService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly imageService: ImageService,
  ) {}

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

    this.formField = this.subFormService.getControl(this.form, this.subForm, this.subFormType, -1, '', this.field.name);
  }

  public selectFile(): void {
    this.fileManagerDialogRef = this.matDialog.open(FileManagerComponent, {panelClass: DialogConfig.fullDialogOverlay});
    this.fileManagerDialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroyer))
      .subscribe((fileItem: FileItem) => {
        if (!fileItem) {
          return;
        } else {
          const fileSrc = this.imageService.parseImagePath(fileItem);
          if (this.subForm === -1) {
            (this.form.get(this.field.name) as AbstractControl).patchValue(fileSrc);
          } else if (this.subForm !== -1) {
            (
              (this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this.field.name) as AbstractControl
            ).patchValue(fileSrc);
          }
          this.fileManagerDialogRef = undefined;
        }
        this.changeDetectorRef.markForCheck();
      });
  }

  public get icon(): string {
    let icon = '';
    if (this.subForm === -1) {
      icon = (this.form.get(this.field.name) as AbstractControl).value;
    } else if (this.subForm !== -1) {
      icon = ((this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this.field.name) as AbstractControl)
        .value;
    }
    return icon;
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  public clearSelected(): void {
    this.formField.setValue('');
  }
}
