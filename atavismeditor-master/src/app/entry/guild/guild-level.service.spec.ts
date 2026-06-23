import {GuildLevelService} from './guild-level.service';
import {TestBed} from '@angular/core/testing';
import {FormBuilder} from '@angular/forms';
import {TranslateServiceMockProvider} from '../../services/translate.service.mock';
import {ProfilesServiceMockProvider} from '../../settings/profiles/profiles.service.mock';
import {TablesServiceMockProvider} from '../../services/tables.service.mock';
import {NotificationServiceMockProvider} from '../../services/notification.service.mock';
import {DatabaseServiceMockProvider} from '../../services/database.service.mock';
import {DropdownItemsServiceMockProvider} from '../dropdown-items.service.mock';

describe('GuildLevelService', () => {
  let service: GuildLevelService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GuildLevelService,
        FormBuilder,
        TranslateServiceMockProvider,
        ProfilesServiceMockProvider,
        TablesServiceMockProvider,
        NotificationServiceMockProvider,
        DatabaseServiceMockProvider,
        DropdownItemsServiceMockProvider,
      ],
    });
    service = TestBed.inject(GuildLevelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should form be created', () => {
    const form = service.createForm();
    expect(form).toBeDefined();
  });
});
