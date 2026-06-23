import {NgModule} from '@angular/core';
import {MatMomentDateModule} from '@angular/material-moment-adapter';
import {MatBadgeModule} from '@angular/material/badge';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MAT_DIALOG_DEFAULT_OPTIONS, MatDialogModule} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {CloseScrollStrategy, Overlay, OverlayModule} from '@angular/cdk/overlay';
import {MatChipsModule} from '@angular/material/chips';
import {MAT_AUTOCOMPLETE_SCROLL_STRATEGY, MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatSliderModule} from '@angular/material/slider';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {DragDropModule} from '@angular/cdk/drag-drop';

const modules = [
  MatTableModule,
  MatMomentDateModule,
  MatButtonModule,
  MatIconModule,
  MatTabsModule,
  MatMenuModule,
  MatDialogModule,
  MatToolbarModule,
  MatInputModule,
  MatCheckboxModule,
  MatDatepickerModule,
  MatFormFieldModule,
  MatTooltipModule,
  MatCardModule,
  MatSnackBarModule,
  MatProgressSpinnerModule,
  MatSnackBarModule,
  MatPaginatorModule,
  MatBadgeModule,
  MatRadioModule,
  MatSelectModule,
  MatDividerModule,
  MatSortModule,
  MatSlideToggleModule,
  MatListModule,
  OverlayModule,
  MatChipsModule,
  MatAutocompleteModule,
  MatSliderModule,
  MatProgressBarModule,
  DragDropModule,
];

export function autoCompleteScroll(overlay: Overlay): () => CloseScrollStrategy {
  return () => overlay.scrollStrategies.close();
}

@NgModule({
  imports: [modules],
  exports: [modules],
  providers: [
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {disableClose: true, hasBackdrop: true}},
    {provide: MAT_AUTOCOMPLETE_SCROLL_STRATEGY, deps: [Overlay], useFactory: autoCompleteScroll},
  ],
})
export class MaterialModule {}
