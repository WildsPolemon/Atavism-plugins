import {TestBed} from '@angular/core/testing';
import {FormBuilder} from '@angular/forms';
import {Task, TaskService} from './task.service';
import {TranslateServiceMockProvider} from '../../services/translate.service.mock';
import {NotificationServiceMockProvider} from '../../services/notification.service.mock';
import {DropdownItemsServiceMockProvider} from '../dropdown-items.service.mock';
import {DatabaseServiceMockProvider} from '../../services/database.service.mock';
import {ProfilesServiceMockProvider} from '../../settings/profiles/profiles.service.mock';
import {TablesServiceMockProvider} from '../../services/tables.service.mock';
import {DatabaseService} from '../../services/database.service';
import {TablesService} from '../../services/tables.service';

describe('TaskService', () => {
  let service: TaskService;
  let databaseService: DatabaseService;
  let tablesService: TablesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        FormBuilder,
        TranslateServiceMockProvider,
        ProfilesServiceMockProvider,
        TablesServiceMockProvider,
        NotificationServiceMockProvider,
        DatabaseServiceMockProvider,
        DropdownItemsServiceMockProvider,
      ],
    });
    service = TestBed.inject(TaskService);
    databaseService = TestBed.inject(DatabaseService);
    tablesService = TestBed.inject(TablesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create new item', async () => {
    const databaseInsertSpy = spyOn(databaseService, 'insert').and.returnValue(Promise.resolve(1));
    const tableOpenDialogSpy = spyOn(tablesService, 'openDialog').and.returnValue(
      Promise.resolve({name: 'Task 1'} as Task),
    );
    const result = await service.addItem();
    expect(tableOpenDialogSpy).toHaveBeenCalled();
    expect(databaseInsertSpy).toHaveBeenCalled();
    expect(result).toEqual({id: 1, value: 'Task 1'});
  });
});
