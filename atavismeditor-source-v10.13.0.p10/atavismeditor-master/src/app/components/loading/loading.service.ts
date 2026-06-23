import {Injectable} from '@angular/core';
import {ReplaySubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSource = new ReplaySubject<boolean>(1);
  public loading = this.loadingSource.asObservable();

  constructor() {}

  public show(): void {
    this.loadingSource.next(true);
  }

  public hide(): void {
    this.loadingSource.next(false);
  }
}
