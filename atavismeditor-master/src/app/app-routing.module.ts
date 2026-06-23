import {NgModule} from '@angular/core';
import {Routes, RouterModule, PreloadAllModules} from '@angular/router';
import {ProfileGuard} from './settings/profiles/profile.guard';
import {HomeComponent} from './home/home.component';

const routes: Routes = [
  {path: '', loadChildren: () => import('./tabs/tabs.module').then((m) => m.TabsModule), canActivate: [ProfileGuard]},
  {path: 'home', component: HomeComponent},
  {
    path: 'translation',
    loadChildren: () => import('./settings/translation/translation.module').then((m) => m.TranslationModule),
  },
  {
    path: 'theme-settings',
    loadChildren: () => import('./settings/theme-settings/theme-settings.module').then((m) => m.ThemeSettingsModule),
  },
  {path: '**', redirectTo: '', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
