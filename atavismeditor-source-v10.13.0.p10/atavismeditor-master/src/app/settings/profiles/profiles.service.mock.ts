import {Provider} from '@angular/core';
import {ProfilesService} from './profiles.service';

export class ProfilesServiceMock {}

export const ProfilesServiceMockProvider: Provider = {provide: ProfilesService, useClass: ProfilesServiceMock};
