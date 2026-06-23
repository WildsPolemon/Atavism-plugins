import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {interval, Subject} from 'rxjs';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TooltipHelperComponent} from '../../../components/form/tooltip-helper/tooltip-helper.component';
import {DialogCloseType, DialogConfig, FormFieldConfig, FormFieldType} from '../../../models/configs';
import {TabTypes} from '../../../models/tabTypes.enum';
import {TranslateService} from '@ngx-translate/core';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {SubFormService, TableTooltip} from '../../sub-form.service';
import {DialogType} from '../../../models/types';
import {FuseConfirmDialogComponent} from '../../../../@fuse/components/confirm-dialog/confirm-dialog.component';
import {filter, map, take, takeUntil} from 'rxjs/operators';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {DropdownValue} from '../../../models/configRow.interface';
import {
  BehaviorConditions,
  BehaviorConditionsGroup,
  FleeType,
  MobAbility,
  MobAbilityConditions,
  MobAbilityConditionsGroup,
  MobBehavior,
  MobBehaviorPoints,
  MobBehaviorProfile,
  MobBehaviorType
} from '../mob-behavior-profile';
import {
  abilityFieldConfig,
  effectTagsFieldConfig,
  mobTagsFieldConfig,
  statFieldConfig,
  weaponItemFieldConfig
} from '../../dropdown.config';
import {minNotEqualValidator} from '../../../validators/min-not-equal.validator';
import {maxNotEqualValidator} from '../../../validators/max-not-equal.validator';

export interface AllValidationErrors {
  control_name: string;
  error_name: string;
  error_value: any;
}

export interface FormGroupControls {
  [key: string]: AbstractControl;
}

@Component({
  selector: 'atv-mob-behavior-profile-form',
  templateUrl: './mob-behavior-profile-form.component.html',
  styleUrls: ['./mob-behavior-profile-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobBehaviorProfileFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  showTooltip = false;
  tooltip = '';
  tableKey = TabTypes.MOB_BEHAVIOR_PROFILE;
  MobBehaviorType = MobBehaviorType;
  allowHelper = false;
  disableTooltip = true;
  submit?: string;
  readonly mobBehaviorType: DropdownValue[] = [
   // {id: MobBehaviorType.Melee, value: this.translate.instant(this.tableKey + '.Melee')},
    {id: MobBehaviorType.Offensive, value: this.translate.instant(this.tableKey + '.Offensive')},
    {id: MobBehaviorType.Defensive, value: this.translate.instant(this.tableKey + '.Defensive')},
    {id: MobBehaviorType.Defend, value: this.translate.instant(this.tableKey + '.Defend')},
    {id: MobBehaviorType.Flee, value: this.translate.instant(this.tableKey + '.Flee')},
    {id: MobBehaviorType.Heal, value: this.translate.instant(this.tableKey + '.Heal')},
  ];
  readonly fleeTypes: DropdownValue[] = [
    {id: FleeType["Opposite direction"], value: this.translate.instant(this.tableKey + '.OppositeDirection')},
    {id: FleeType["Defined position"], value: this.translate.instant(this.tableKey + '.DefinedPosition')},
    {id: FleeType["To group friendly mobs"], value: this.translate.instant(this.tableKey + '.ToGroupFriendlyMobs')},
  ];
  readonly behaviourConditionsTypes: DropdownValue[] = [
    {id: 1, value: this.translate.instant(this.tableKey + '.Distance')},
    {id: 2, value: this.translate.instant(this.tableKey + '.Stat')},
    {id: 3, value: this.translate.instant(this.tableKey + '.Effect')},
    {id: 6, value: this.translate.instant(this.tableKey + '.NumberOfTargets')},
  ];
  readonly abilityConditionsTypes: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.Event')},
    {id: 2, value: this.translate.instant(this.tableKey + '.Stat')},
    {id: 3, value: this.translate.instant(this.tableKey + '.Effect')},
    {id: 4, value: this.translate.instant(this.tableKey + '.CombatState')},
    {id: 5, value: this.translate.instant(this.tableKey + '.DeathState')},
    {id: 6, value: this.translate.instant(this.tableKey + '.NumberOfTargets')},
  ];
  readonly eventTypeDropdown: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.Parry')},
    {id: 1, value: this.translate.instant(this.tableKey + '.Dodge')},
    {id: 2, value: this.translate.instant(this.tableKey + '.Miss')},
    {id: 3, value: this.translate.instant(this.tableKey + '.Damage')},
    {id: 4, value: this.translate.instant(this.tableKey + '.Heal')},
    {id: 5, value: this.translate.instant(this.tableKey + '.Critical')},
    // {id: 6, value: this.translate.instant(this.tableKey + '.Kill')},
    {id: 7, value: this.translate.instant(this.tableKey + '.Stun')},
    {id: 8, value: this.translate.instant(this.tableKey + '.Sleep')},
  ];
  readonly targetOptions: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.SELF')},
    {id: 1, value: this.translate.instant(this.tableKey + '.TARGET')},
  ];
  readonly config: Record<string, FormFieldConfig> = {
    ['name']: {name: 'name', type: FormFieldType.input, require: true, length: 256, width: 100},
    ['type']: {name: 'type', type: FormFieldType.dropdown, data: this.mobBehaviorType, require: true, search: false},
    ['flee_type']: {name: 'flee_type', type: FormFieldType.dropdown, data: this.fleeTypes, require: true, search: false},
    ['ability_interval']: {name: 'ability_interval', type: FormFieldType.integer, require: true},
    ['ignore_chase_distance']: {name: 'ignore_chase_distance', type: FormFieldType.boolean},
    ['weapon']: {name: 'weapon', type: FormFieldType.dynamicDropdown, allowNew: true, width: 50, fieldConfig: weaponItemFieldConfig},
    ['loc_x']: {name: 'loc_x', type: FormFieldType.decimal, require: true},
    ['loc_y']: {name: 'loc_y', type: FormFieldType.decimal, require: true},
    ['loc_z']: {name: 'loc_z', type: FormFieldType.decimal, require: true},
    ['mob_tag']: {name: 'mob_tag', type: FormFieldType.dynamicDropdown, fieldConfig: mobTagsFieldConfig, allowNew: true, require: true},
    ['bcType']: {name: 'type', type: FormFieldType.dropdown, data: this.behaviourConditionsTypes, hideNone: true, require: true, search: false, tooltip: this.translate.instant(`${this.tableKey}.BEHAVIOR_CONDITION_TYPE_HELP`)},
    ['abcType']: {name: 'type', type: FormFieldType.dropdown, data: this.abilityConditionsTypes, hideNone: true, require: true, search: false, tooltip: this.translate.instant(`${this.tableKey}.ABILITY_CONDITION_TYPE_HELP`)},
    ['distance']: {name: 'distance', type: FormFieldType.decimal, require: true},
    ['less']: {name: 'less', type: FormFieldType.boolean},
    ['combat_state']: {name: 'combat_state', type: FormFieldType.boolean},
    ['death_state']: {name: 'death_state', type: FormFieldType.boolean},
    ['stat_name']: {name: 'stat_name', type: FormFieldType.dynamicDropdown, fieldConfig: statFieldConfig, allowNew: true, require: true},
    ['stat_value']: {name: 'stat_value', type: FormFieldType.integer, require: true},
    ['stat_vitality_percentage']: {name: 'stat_vitality_percentage', type: FormFieldType.boolean},
    ['trigger_event_Id']: {name: 'trigger_event_Id', type: FormFieldType.dropdown, hideNone: true, data: this.eventTypeDropdown, require: true},
    ['effect_tag_id']: {name: 'effect_tag_id', type: FormFieldType.dynamicDropdown, allowNew: true, fieldConfig: effectTagsFieldConfig, require: true},
    ['target']: {name: 'target', type: FormFieldType.dropdown, hideNone: true, data: this.targetOptions, require: true},
    ['on_target']: {name: 'on_target', type: FormFieldType.boolean},
    ['target_number']: {name: 'target_number', type: FormFieldType.integer, require: true},
    ['target_ally']: {name: 'target_ally', type: FormFieldType.boolean},
    ['minAbilityRangePercentage']: {name: 'minAbilityRangePercentage', type: FormFieldType.decimal, require: true},
    ['maxAbilityRangePercentage']: {name: 'maxAbilityRangePercentage', type: FormFieldType.decimal, require: true},
    ['ability']: {name: 'ability', type: FormFieldType.dynamicDropdown, allowNew: true, fieldConfig: abilityFieldConfig, require: true},
    ['priority']: {name: 'priority', type: FormFieldType.integer, require: true},
  };

  private profile?: MobBehaviorProfile;

  private destroyer = new Subject<void>();
  public DialogCloseType = DialogCloseType;

  constructor(
    private readonly fb: FormBuilder,
    private readonly elem: ElementRef,
    private readonly matDialog: MatDialog,
    private readonly translate: TranslateService,
    private readonly subFormService: SubFormService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    public matDialogRef: MatDialogRef<MobBehaviorProfileFormComponent>,
    @Inject(MAT_DIALOG_DATA) private data: {profile?: MobBehaviorProfile, submit?: string}) {
    this.profile = this.data.profile;
    this.submit = this.data.submit;
  }

  ngOnInit(): void {
    this.subFormService.showTooltips
      .pipe(
        filter(() => !!this.tableKey),
        map(
          (tables: TableTooltip[]) =>
            tables.find((item: TableTooltip) => item.table === this.tableKey) as TableTooltip,
        ),
        filter((tableTooltip: TableTooltip) => !!tableTooltip),
        map((tableTooltip: TableTooltip) => tableTooltip.value),
        takeUntil(this.destroyer),
      )
      .subscribe((showTooltip) => {
        this.disableTooltip = !showTooltip;
        this.changeDetectorRef.markForCheck();
      });
    if (this.translate.instant(`${this.tableKey}.TITLE_TOOLTIP`) !== `${this.tableKey}.TITLE_TOOLTIP`) {
      this.allowHelper = true;
    }
    this.buildForm();
  }

  cancelForm(): void {
    this.matDialogRef.close([undefined, undefined]);
  }

  submitForm(action: DialogCloseType): void {
    this.form.markAllAsTouched();
    this.form.markAsDirty();
    if (this.form.valid) {
      if (action === DialogCloseType.save_as_new) {
      }
      this.matDialogRef.close([this.form.value, action]);
    } else {
      this.scrollToErrors();
    }
  }

  ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  openHelp(): void {
    if (this.allowHelper) {
      const helperComp = this.matDialog.open(TooltipHelperComponent, {
        panelClass: DialogConfig.confirmDialogOverlay,
        disableClose: false,
      });
      helperComp.componentInstance.message = this.translate.instant(`${this.tableKey}.TITLE_TOOLTIP`);
    }
  }

  public toggleTooltips(event: MatSlideToggleChange): void {
    this.subFormService.toggleTooltip(this.tableKey, event.checked);
  }

  public subFormGroupArray(form: FormGroup | AbstractControl, name: string, subFormGroup?: string): FormArray {
    if (subFormGroup) {
      return (form.get(subFormGroup) as FormGroup).get(name) as FormArray;
    }
    return (form.get(name) as FormArray);
  }

  public subFormGroupArrayFormGroup(form: FormGroup | AbstractControl, name: string, i: number, subFormGroup?: string): FormGroup {
    if (subFormGroup) {
      return ((form.get(subFormGroup) as FormGroup).get(name) as FormArray).at(i) as FormGroup;
    }
    return (form.get(name) as FormArray).at(i) as FormGroup;
  }

  public mobBehaviors() {
    return this.form.get('mobBehavior') as FormArray;
  }

  public addMobBehaviorForm(mobBehavior?: MobBehavior): void {
    const subForm = this.fb.group({
      id: new FormControl(mobBehavior?.id ?? null),
      type: new FormControl(mobBehavior?.type ?? null, Validators.required),
      ability_interval: new FormControl((mobBehavior?.ability_interval && mobBehavior.ability_interval >= 1) ? mobBehavior.ability_interval : 1000, [Validators.required, Validators.min(1)]),
      ignore_chase_distance: new FormControl(mobBehavior?.ignore_chase_distance ?? false),
      weapon: new FormControl(mobBehavior?.weapon ?? -1),
      flee_type: new FormControl(mobBehavior?.flee_type ?? null, Validators.required),
      mob_tag: new FormControl(mobBehavior?.mob_tag ?? null, Validators.required),
      behaviorConditionsGroup: new FormArray([]),
      pointsGroup: new FormArray([]),
      mobAbility: this.fb.group({
        abilityGroups: new FormArray([]),
      }),
      mobAbilityStart: this.fb.group({
        abilityGroups: new FormArray([]),
      }),
      mobAbilityEnd: this.fb.group({
        abilityGroups: new FormArray([]),
      }),
    });

    subForm.get('mobAbilityStart').disable();
    subForm.get('mobAbilityEnd').disable();
    subForm.get('mob_tag').disable();
    (this.form.get('mobBehavior') as FormArray).push(subForm);

    if (mobBehavior?.pointsGroup && mobBehavior.pointsGroup.length > 0) {
      mobBehavior.pointsGroup.forEach((point) => {
        this.addPointsGroupForm(subForm.get('pointsGroup') as FormArray, point);
      });
      this.mobBehaviourFleeTypeChange(subForm, mobBehavior.flee_type);
    } else {
      this.addPointsGroupForm(subForm.get('pointsGroup') as FormArray);
      this.mobBehaviourFleeTypeChange(subForm, null);
    }
    if(mobBehavior?.behaviorConditionsGroup && mobBehavior.behaviorConditionsGroup.length > 0) {
      mobBehavior.behaviorConditionsGroup.forEach((group) => {
        this.addBehaviourConditionGroupForm(subForm.get('behaviorConditionsGroup') as FormArray, group);
      });
    }

    subForm.get('type').valueChanges.pipe(takeUntil(this.destroyer)).subscribe((type) => {
      this.mobBehaviourTypeChange(subForm, type);
    });
    subForm.get('flee_type').valueChanges.pipe(takeUntil(this.destroyer)).subscribe((type) => {
      this.mobBehaviourFleeTypeChange(subForm, type);
    });
    if(mobBehavior?.mobAbilityStart && mobBehavior?.mobAbilityStart.abilityGroups && mobBehavior?.mobAbilityStart.abilityGroups.length > 0) {
      mobBehavior.mobAbilityStart.abilityGroups.forEach((abilityGroup) => {
        this.addAbilityGroupForm(subForm.get('mobAbilityStart').get('abilityGroups') as FormArray, 1, abilityGroup);
      });
    } else {
     // this.addAbilityGroupForm(subForm.get('mobAbilityStart').get('abilityGroups') as FormArray, 1);
    }
    if(mobBehavior?.mobAbility && mobBehavior?.mobAbility.abilityGroups && mobBehavior?.mobAbility.abilityGroups.length > 0) {
      mobBehavior.mobAbility.abilityGroups.forEach((abilityGroup) => {
        this.addAbilityGroupForm(subForm.get('mobAbility').get('abilityGroups') as FormArray, 0, abilityGroup);
      });
    } else {
     // this.addAbilityGroupForm(subForm.get('mobAbility').get('abilityGroups') as FormArray, 0);
    }
    if(mobBehavior?.mobAbilityEnd && mobBehavior?.mobAbilityEnd.abilityGroups && mobBehavior?.mobAbilityEnd.abilityGroups.length > 0) {
      mobBehavior.mobAbilityEnd.abilityGroups.forEach((abilityGroup) => {
        this.addAbilityGroupForm(subForm.get('mobAbilityEnd').get('abilityGroups') as FormArray, 2, abilityGroup);
      });
    } else {
     // this.addAbilityGroupForm(subForm.get('mobAbilityEnd').get('abilityGroups') as FormArray, 2);
    }
    this.mobBehaviourTypeChange(subForm, mobBehavior?.type ?? null);

  }

  private mobBehaviourTypeChange(subForm: FormGroup, type: MobBehaviorType): void {
    subForm.get('mobAbilityStart').disable();
    subForm.get('mobAbilityEnd').disable();
    subForm.get('flee_type').disable();
    if (type === MobBehaviorType.Flee) {
      subForm.get('mobAbilityStart').enable();
      subForm.get('mobAbilityEnd').enable();
      subForm.get('flee_type').enable();
    } else if (type !== null){
      if((subForm.get('mobAbility').get('abilityGroups')as FormArray).length === 0)
      {
        this.addAbilityGroupForm(subForm.get('mobAbility').get('abilityGroups') as FormArray, 0);
      }
    }
    subForm.get('mob_tag').disable();
    if(type=== MobBehaviorType.Heal || type === MobBehaviorType.Defend){
      subForm.get('mob_tag').enable();
    }
  }

  private mobBehaviourFleeTypeChange(subForm: FormGroup, type: FleeType): void {
    if (type === FleeType["Defined position"]) {
      subForm.get('pointsGroup').enable();
    } else {
      subForm.get('pointsGroup').disable();
    }
  }

  addBehaviourConditionGroupForm(parentForm: FormArray, group?: BehaviorConditionsGroup): void {
    const subForm = this.fb.group({
      id: new FormControl(group?.id ?? null),
      behaviorConditions: new FormArray([]),
    });
    parentForm.push(subForm);
    if (group?.behaviorConditions && group.behaviorConditions.length > 0) {
      group.behaviorConditions.forEach((condition) => {
        this.addBehaviourCondition(subForm.get('behaviorConditions') as FormArray, condition);
      });
    } else {
      this.addBehaviourCondition(subForm.get('behaviorConditions') as FormArray);
    }
  }

  addAbilityGroupForm(parentForm: FormArray, mob_ability_type: number, abilityGroup?: MobAbility): void {
    const subForm = this.fb.group({
      id: new FormControl(abilityGroup?.id ?? null),
      mob_ability_type: new FormControl(mob_ability_type),
      minAbilityRangePercentage: new FormControl(abilityGroup?.minAbilityRangePercentage ?? 50, [Validators.min(0), maxNotEqualValidator(100)]),
      maxAbilityRangePercentage: new FormControl(abilityGroup?.maxAbilityRangePercentage ?? 50, [minNotEqualValidator(0), Validators.max(100)]),
      abilities: new FormArray([]),
      abilityConditionGroups: new FormArray([]),
    });
    parentForm.push(subForm);
    if (abilityGroup?.abilities) {
      const abilitiesArr: number[] = abilityGroup.abilities.split(';').map((v) => Number(v));
      const abilities = [];
      for(let i = 0; i < abilitiesArr.length; i += 2) {
        if (abilitiesArr[i]) {
          abilities.push({
            ability: abilitiesArr[i],
            priority: abilitiesArr[i + 1],
          })
        }
      }
      if (abilities.length > 0) {
        abilities.forEach((ab) => {
          this.addAbilitySubForm(subForm.get('abilities') as FormArray, ab);
        })
      } else {
        this.addAbilitySubForm(subForm.get('abilities') as FormArray);
      }
    } else {
      this.addAbilitySubForm(subForm.get('abilities') as FormArray);
    }
    if(abilityGroup?.abilityConditionGroups && abilityGroup.abilityConditionGroups.length > 0) {
      abilityGroup.abilityConditionGroups.forEach((group) => {
        this.addAbilityConditionGroupForm(subForm.get('abilityConditionGroups') as FormArray, group);
      });
    }
  }

  addPointsGroupForm(parentForm: FormArray, point?: MobBehaviorPoints): void {
    const subForm = this.fb.group({
      id: new FormControl(point?.id ?? null),
      loc_x: new FormControl(point?.loc_x ?? 0),
      loc_y: new FormControl(point?.loc_y ?? 0),
      loc_z: new FormControl(point?.loc_z ?? 0),
    });2
    parentForm.push(subForm);
  }

  addAbilityConditionGroupForm(parentForm: FormArray, group?: MobAbilityConditionsGroup): void {
    const subForm = this.fb.group({
      abilityConditions: new FormArray([]),
    });
    parentForm.push(subForm);
    if (group?.abilityConditions && group.abilityConditions.length > 0) {
      group.abilityConditions.forEach((condition) => {
        this.addAbilityCondition(subForm.get('abilityConditions') as FormArray, condition);
      });
    } else {
      this.addAbilityCondition(subForm.get('abilityConditions') as FormArray);
    }
  }

  addBehaviourCondition(parentForm: FormArray, condition?: BehaviorConditions): void {
    const subForm = this.fb.group({
      id: new FormControl(condition?.id ?? null),
      type: new FormControl(condition?.type ?? null, Validators.required),

      less: new FormControl( condition?.less ?? true),
      stat_vitality_percentage: new FormControl(condition?.stat_vitality_percentage ?? false),
      effect_tag_id: new FormControl(condition?.effect_tag_id ?? -1, Validators.required),
      target: new FormControl((condition?.target && condition.target !== -1) ? condition?.target : 0, Validators.required),
      on_target: new FormControl(condition?.on_target ?? true),
      target_number: new FormControl((condition?.target_number && condition.target_number >= 0) ? condition.target_number : null, Validators.min(1)),
      target_ally: new FormControl(condition?.target_ally ?? true),
    });
    subForm.get('type').valueChanges.pipe(takeUntil(this.destroyer)).subscribe((type: number) => {
      this.conditionTypeChange(subForm, type, true, condition);
    });
    this.conditionTypeChange(subForm, condition?.type ?? null, true, condition);
    parentForm.push(subForm);
  }

  addAbilityCondition(parentForm: FormArray, condition?: MobAbilityConditions): void {
    const subForm = this.fb.group({
      id: new FormControl(condition?.id ?? null),
      type: new FormControl(condition?.type ?? null, Validators.required),
      less: new FormControl(condition?.less ?? true),
      stat_vitality_percentage: new FormControl(condition?.stat_vitality_percentage ?? false),
      effect_tag_id: new FormControl(condition?.effect_tag_id ?? null, Validators.required),
      trigger_event_Id: new FormControl((condition?.trigger_event_Id && condition.trigger_event_Id !== -1) ? condition?.trigger_event_Id : null, Validators.required),
      target: new FormControl((condition?.target && condition.target !== -1) ? condition?.target : 0, Validators.required),
      on_target: new FormControl(condition?.on_target ?? true),
      target_number: new FormControl((condition?.target_number && condition.target_number !== -1) ? condition?.target_number : null, Validators.min(1)),
      target_ally: new FormControl(condition?.target_ally ?? true),
      combat_state: new FormControl(condition?.combat_state ?? true),
      death_state: new FormControl(condition?.death_state ?? false),
    });
    subForm.get('type').valueChanges.pipe(takeUntil(this.destroyer)).subscribe((type: number) => {
      this.conditionTypeChange(subForm, type, false, condition);
    });
    this.conditionTypeChange(subForm, condition?.type ?? null, false, condition);
    parentForm.push(subForm);
  }

  private conditionTypeChange(subForm: FormGroup, type: number | null, behavior = false, condition?: BehaviorConditions): void {
    if(behavior) {
      subForm.removeControl('distance');
    }
    subForm.removeControl('stat_name');
    subForm.removeControl('stat_value');
    if (behavior && type === 1) { // Distance
      subForm.addControl('distance', new FormControl((condition?.distance && condition.distance !== -1) ? condition.distance : null, [Validators.required, Validators.min(0)]));
    } else if (type === 2) { // Stat
      subForm.get('target').enable();
      subForm.addControl('target', new FormControl(condition?.target ?? 0, Validators.required));
      subForm.addControl('stat_name', new FormControl(condition?.stat_name ?? '', Validators.required));
      subForm.addControl('stat_value', new FormControl(condition?.stat_value ?? '', Validators.required));
    } else if (type === 3) { // Effect
      subForm.get('target').enable();
      subForm.get('effect_tag_id').enable();
      subForm.addControl('effect_tag_id', new FormControl(condition?.effect_tag_id ?? null, Validators.required));
      subForm.addControl('target', new FormControl(condition?.target ?? 0, Validators.required));
     }
    if(!behavior) {
      if (type === 0) {
        subForm.get('trigger_event_Id').enable();
      } else {
        subForm.get('trigger_event_Id').disable();
      }
    }
    if (type === 6) { // Number of targets
      subForm.get('target_number').enable();
    }else{
      subForm.get('target_number').disable();
    }
    if(![2,3].includes(type)){
      subForm.get('target').disable();
      subForm.get('effect_tag_id').disable();
    }
  }

  addAbilitySubForm(parentForm: FormArray | AbstractControl, ability?: {ability: number, priority: number}): void {
    const subForm = this.fb.group({
      ability: new FormControl(ability?.ability ?? null, Validators.required),
      priority: new FormControl(ability?.priority ?? null, [Validators.required, Validators.min(1)])
    });
    (parentForm as FormArray).push(subForm);
  }

  drop(event: CdkDragDrop<string[]>, type: string): void {
    moveItemInArray((this.form.get(type) as FormArray).controls, event.previousIndex, event.currentIndex);
    moveItemInArray((this.form.get(type) as FormArray).value, event.previousIndex, event.currentIndex);
    this.changeDetectorRef.detectChanges();
  }

  dropChild(event: CdkDragDrop<string[]>, i: number, type: string): void {
    const list = ((this.form.get('mobBehavior') as FormArray).at(i).get(type) as FormArray);
    moveItemInArray(list.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(list.value, event.previousIndex, event.currentIndex);
    this.changeDetectorRef.detectChanges();
  }

  dropAbilityChild(event: CdkDragDrop<string[]>, type: string, parentForm: FormGroup | AbstractControl, i: number): void {
    const list = (parentForm.get(type).get('abilityGroups') as FormArray).at(i).get('abilityConditionGroups') as FormArray;
    moveItemInArray(list.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(list.value, event.previousIndex, event.currentIndex);
    this.changeDetectorRef.detectChanges();
  }

  dropAbilityGroup(event: CdkDragDrop<string[]>, type: string, parentForm: FormGroup | AbstractControl): void {
    const list = (parentForm.get(type).get('abilityGroups') as FormArray);
    moveItemInArray(list.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(list.value, event.previousIndex, event.currentIndex);
    this.changeDetectorRef.detectChanges();
  }


  errors(control: AbstractControl): string[] {
    if (control && control.touched && control.errors) {
      return Object.keys(control.errors).map((key) => key.toUpperCase());
    }
    return [];
  }

  removeSubForm(form: FormGroup | AbstractControl, name: string, i: number, subFormGroup?: string): void {
    let confirmDialogRef: DialogType<FuseConfirmDialogComponent> = this.matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    confirmDialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroyer))
      .subscribe((result) => {
        if (result) {
          if (subFormGroup) {
            (form.get(subFormGroup).get(name) as FormArray).removeAt(i);
          } else {
            (form.get(name) as FormArray).removeAt(i);
          }
        }
        confirmDialogRef = undefined;
        this.changeDetectorRef.markForCheck();
      });
  }

  getFieldConfig(fieldName: string, form: FormGroup | AbstractControl): FormFieldConfig | undefined {
    if (fieldName === 'stat_value') {
      return {
        ...this.config.stat_value,
        type: form.get('stat_vitality_percentage').value ? FormFieldType.decimal : FormFieldType.integer
      }
    }
    return undefined;
  }

  private buildForm(): void {
    this.form = this.fb.group({
      id: new FormControl(this.profile?.id ?? null),
      name: new FormControl(this.profile?.name ?? '', [Validators.required, Validators.maxLength(256)]),
      mobBehavior: new FormArray([]),
    });
    if (this.profile && this.profile.mobBehavior) {
      this.profile.mobBehavior.forEach((mobBehaviour) => {
        this.addMobBehaviorForm(mobBehaviour);
      });
    } else {
      this.addMobBehaviorForm();
    }
  }

  private scrollToErrors(): void {
    const elements = this.elem.nativeElement.querySelectorAll('mat-form-field.ng-invalid');
    elements.forEach((element)=>{
      if (element.hidden === false) {
        interval(650)
          .pipe(take(1))
          .subscribe(() => element.scrollIntoView({behavior: 'smooth'}));
        return;
      }
    })

  }
}
