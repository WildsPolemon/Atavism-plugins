import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {MaterialModule} from '@fuse/material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FuseConfirmDialogModule, FuseProgressBarModule, FuseSidebarModule} from '@fuse/components';
import {PopoverModule} from 'ngx-smart-popover';
import {FormComponent} from './form/form.component';
import {SubFormComponent} from './form/sub-form/sub-form.component';
import {SubSubFormComponent} from './form/sub-sub-form/sub-sub-form.component';
import {FieldsContainerComponent} from './form/fields-container/fields-container.component';
import {BooleanComponent} from './form/fields/boolean/boolean.component';
import {DropdownComponent} from './form/fields/dropdown/dropdown.component';
import {DropdownSearchComponent} from './form/fields/dropdown/dropdown-search/dropdown-search.component';
import {FileComponent} from './form/fields/file/file.component';
import {FilePickerComponent} from './form/fields/file-picker/file-picker.component';
import {HiddenComponent} from './form/fields/hidden/hidden.component';
import {InputComponent} from './form/fields/input/input.component';
import {TextAreaComponent} from './form/fields/textarea/textarea.component';
import {TableComponent} from './table/table.component';
import {TableSearchComponent} from './table/table-search/table-search.component';
import {TableConfigComponent} from './table/table-config/table-config.component';
import {TableFilterInputComponent} from './table/table-search/table-filter-input/table-filter-input.component';
import {DigitOnlyDirective} from '../directives/digit-only.directive';
import {LoadingComponent} from './loading/loading.component';
import {NotificationComponent} from './notification/notification.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FuseDirectivesModule} from '@fuse/directives/directives';
import {ImageComponent} from './image/image.component';
import {MaxNumberDirective} from '../directives/max-number.directive';
import {DynamicDropdownComponent} from './form/fields/dynamic-dropdown/dynamic-dropdown.component';
import {DdMultipleComponent} from './form/fields/dynamic-dropdown/dd-multiple/dd-multiple.component';
import {DdSingleComponent} from './form/fields/dynamic-dropdown/dd-single/dd-single.component';
import {DynamicDropdownService} from './form/fields/dynamic-dropdown/dynamic-dropdown.service';
import {HandleDependenciesComponent} from './handle-dependencies/handle-dependencies.component';
import {HandleOptionDepsComponent} from './handle-option-deps/handle-option-deps.component';
import {FillDatetimePickerComponent} from './form/fields/fill-datetime-picker/fill-datetime-picker.component';
import {NgxMatDatetimePickerModule, NgxMatNativeDateModule} from '@angular-material-components/datetime-picker';
import {FolderSelecterComponent} from './form/fields/folder-selecter/folder-selecter.component';
import {TooltipHelperComponent} from './form/tooltip-helper/tooltip-helper.component';
import {RecordPreviewComponent} from './table/record-preview/record-preview.component';
import {ColorPickerComponent} from './form/fields/color-picker/color-picker.component';
import {ColorPickerModule} from 'ngx-color-picker';

@NgModule({
  declarations: [
    FormComponent,
    SubFormComponent,
    SubSubFormComponent,
    FieldsContainerComponent,
    BooleanComponent,
    DropdownComponent,
    DropdownSearchComponent,
    FileComponent,
    FilePickerComponent,
    HiddenComponent,
    InputComponent,
    TextAreaComponent,
    RecordPreviewComponent,
    TableComponent,
    TableSearchComponent,
    TableConfigComponent,
    TableFilterInputComponent,
    DigitOnlyDirective,
    MaxNumberDirective,
    LoadingComponent,
    NotificationComponent,
    ImageComponent,
    DynamicDropdownComponent,
    DdMultipleComponent,
    DdSingleComponent,
    HandleDependenciesComponent,
    HandleOptionDepsComponent,
    FillDatetimePickerComponent,
    FolderSelecterComponent,
    TooltipHelperComponent,
    ColorPickerComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    FuseSidebarModule,
    FuseDirectivesModule,
    FuseConfirmDialogModule,
    FuseProgressBarModule,
    ReactiveFormsModule,
    MaterialModule,
    PopoverModule,
    TranslateModule,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule,
    ColorPickerModule,
  ],
    exports: [
        FormComponent,
        SubFormComponent,
        SubSubFormComponent,
        FieldsContainerComponent,
        BooleanComponent,
        DropdownComponent,
        DropdownSearchComponent,
        FileComponent,
        FilePickerComponent,
        HiddenComponent,
        InputComponent,
        TextAreaComponent,
        RecordPreviewComponent,
        TableComponent,
        TableSearchComponent,
        TableConfigComponent,
        TableFilterInputComponent,
        DigitOnlyDirective,
        MaxNumberDirective,
        LoadingComponent,
        NotificationComponent,
        ImageComponent,
        DynamicDropdownComponent,
        FolderSelecterComponent,
      ColorPickerComponent,
    ],
  providers: [DynamicDropdownService],
})
export class CustomComponentModule {}
