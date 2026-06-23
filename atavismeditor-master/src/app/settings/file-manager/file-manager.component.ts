import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {FileManagerService} from './file-manager.service';
import {combineLatest, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, startWith, takeUntil, tap} from 'rxjs/operators';
import {FormControl} from '@angular/forms';
import {FileExtension, FileItem} from './file-manager.interfaces';
import {fuseAnimations} from '@fuse/animations';
import {MatDialogRef} from '@angular/material/dialog';
import {LoadingService} from '../../components/loading/loading.service';
import {ProfilesService} from '../profiles/profiles.service';
import {Profile} from '../profiles/profile';
import {getProfilePipe} from '../../directives/utils';
import {ImageService} from '../../components/image/image.service';
import {ElectronService} from '../../services/electron.service';

@Component({
  selector: 'atv-file-manager',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class FileManagerComponent implements OnDestroy, AfterViewInit {
  @ViewChild('searchField') private searchField!: ElementRef;
  private destroyer = new Subject<void>();
  public loading = true;
  public searchInput = new FormControl('');
  public files: FileItem[] = [];
  public allFiles: FileItem[] = [];
  public FileExtension = FileExtension;
  public selectedFile: FileItem | undefined = undefined;
  public allowShowPrev = false;
  public allowShowMore = true;
  private showCount = 80;
  private page = 1;
  private profile!: Profile;

  constructor(
    private readonly electronService: ElectronService,
    private readonly fileManagerService: FileManagerService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly loadingService: LoadingService,
    private readonly profilesService: ProfilesService,
    private readonly imageService: ImageService,
    public matDialogRef: MatDialogRef<FileManagerComponent>,
  ) {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile: Profile) => {
      this.profile = profile;
      this.showCount = profile.iconsToShow ? profile.iconsToShow : 80;
    });
    combineLatest([
      this.fileManagerService.files,
      this.searchInput.valueChanges.pipe(
        startWith(''),
        distinctUntilChanged(),
        debounceTime(250),
        tap(() => (this.loading = true)),
      ),
    ])
      .pipe(takeUntil(this.destroyer))
      .subscribe(([files, query]: [FileItem[], string]) => {
        if (query) {
          files = files.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()));
        }
        this.allFiles = files;
        this.page = 1;
        this.showMore();
      });
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchField.nativeElement.focus();
    }, 100);
  }

  public showNext(): void {
    this.loading = true;
    this.page += 1;
    this.showMore();
  }

  public showPrev(): void {
    this.loading = true;
    this.page -= 1;
    this.showMore();
  }

  private showMore() {
    const start = (this.page - 1) * this.showCount;
    let end = this.page * this.showCount;
    this.allowShowPrev = this.page !== 1;
    this.allowShowMore = true;
    if (this.allFiles.length < end) {
      this.allowShowMore = false;
      end = this.allFiles.length;
    }
    this.files = this.allFiles.slice(start, end);
    this.files = this.files.map((file) => {
      if (file.ext === FileExtension.psd || file.ext === FileExtension.tga) {
        file.icon = {
          icon: this.imageService.parseImagePath(file),
          folder: this.profile.folder,
        };
      } else {
        file.src = this.electronService.isWindows ? 'file://' + file.path.replace(/\\/g, '/') : file.path;
      }
      return file;
    });
    this.changeDetectorRef.markForCheck();
    setTimeout(() => {
      this.loading = false;
      this.changeDetectorRef.markForCheck();
    }, 500);
  }

  public selectFile(file: FileItem): void {
    if (this.selectedFile && this.selectedFile.path === file.path) {
      this.selectedFile = undefined;
    } else {
      this.selectedFile = file;
    }
    this.changeDetectorRef.markForCheck();
  }

  public chooseFile(file: FileItem): void {
    this.matDialogRef.close(file);
  }

  public async synchronizeFiles(): Promise<void> {
    this.loadingService.show();
    this.changeDetectorRef.markForCheck();
    setTimeout(async () => {
      await this.fileManagerService.checkFoldersSync();
    });
  }

  public trackByFn(_: unknown, file: FileItem): string {
    return file.path;
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
