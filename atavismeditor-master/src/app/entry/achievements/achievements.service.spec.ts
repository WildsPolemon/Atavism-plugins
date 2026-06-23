import {TestBed} from '@angular/core/testing';
import {AbstractControl, FormBuilder} from '@angular/forms';
import {TranslateServiceMockProvider} from '../../services/translate.service.mock';
import {NotificationServiceMockProvider} from '../../services/notification.service.mock';
import {DropdownItemsServiceMockProvider} from '../dropdown-items.service.mock';
import {DatabaseServiceMockProvider} from '../../services/database.service.mock';
import {ProfilesServiceMockProvider} from '../../settings/profiles/profiles.service.mock';
import {TablesServiceMockProvider} from '../../services/tables.service.mock';
import {AchievementTypesEnum} from './achievements.data';
import {FormFieldType} from '../../models/configs';
import {abilityFieldConfig, itemFieldConfig, mobsFieldConfig, skillFieldConfig} from '../dropdown.config';
import {AchievementsService} from './achievements.service';

describe('AchievementsService', () => {
  let service: AchievementsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AchievementsService,
        FormBuilder,
        TranslateServiceMockProvider,
        ProfilesServiceMockProvider,
        TablesServiceMockProvider,
        NotificationServiceMockProvider,
        DatabaseServiceMockProvider,
        DropdownItemsServiceMockProvider,
      ],
    });
    service = TestBed.inject(AchievementsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should react on form change', () => {
    const formConfig = {...service.formConfig};
    const form = service.createForm(formConfig);
    expect(form).toBeDefined();

    expect((form.get('objects') as AbstractControl).disabled).toBeTrue();
    expect((form.get('objects') as AbstractControl).value).toBe('');

    (form.get('type') as AbstractControl).setValue(AchievementTypesEnum.Kill);
    expect((form.get('objects') as AbstractControl).enabled).toBeTruthy();
    expect(formConfig.fields.objects.type).toBe(FormFieldType.dynamicDropdown);
    expect(formConfig.fields.objects.fieldConfig).toEqual(mobsFieldConfig);
    expect(formConfig.fields.objects.label).toBe(service.tableKey + '.OBJECTIVE_MOB');

    (form.get('type') as AbstractControl).setValue(AchievementTypesEnum.Harvesting);
    expect((form.get('objects') as AbstractControl).enabled).toBeTruthy();
    expect(formConfig.fields.objects.type).toBe(FormFieldType.dynamicDropdown);
    expect(formConfig.fields.objects.fieldConfig).toEqual(skillFieldConfig);
    expect(formConfig.fields.objects.label).toBe(service.tableKey + '.OBJECTIVE_SKILLS');

    (form.get('type') as AbstractControl).setValue(AchievementTypesEnum.Crafting);
    expect((form.get('objects') as AbstractControl).enabled).toBeTruthy();
    expect(formConfig.fields.objects.type).toBe(FormFieldType.dynamicDropdown);
    expect(formConfig.fields.objects.fieldConfig).toEqual(itemFieldConfig);
    expect(formConfig.fields.objects.label).toBe(service.tableKey + '.OBJECTIVE_ITEM');

    (form.get('type') as AbstractControl).setValue(AchievementTypesEnum.UseAbility);
    expect((form.get('objects') as AbstractControl).enabled).toBeTruthy();
    expect(formConfig.fields.objects.type).toBe(FormFieldType.dynamicDropdown);
    expect(formConfig.fields.objects.fieldConfig).toEqual(abilityFieldConfig);
    expect(formConfig.fields.objects.label).toBe(service.tableKey + '.OBJECTIVE_ABILITY');

    (form.get('type') as AbstractControl).setValue(AchievementTypesEnum.GearScore);
    expect((form.get('objects') as AbstractControl).disabled).toBeTruthy();
    expect(formConfig.fields.objects.type).toBe(FormFieldType.hidden);
    expect(formConfig.fields.objects.label).toBe('');
  });
});
