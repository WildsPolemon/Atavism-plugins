import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {ElectronService} from '../../../services/electron.service';
import {TranslateService} from '@ngx-translate/core';
import {TooltipPart} from '../../../models/configs';

@Component({
  selector: 'atv-tooltip-helper',
  templateUrl: './tooltip-helper.component.html',
  styleUrls: ['./tooltip-helper.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipHelperComponent implements OnInit {
  message = '';
  parsedTooltip: TooltipPart[] = [];

  constructor(
    public readonly electronService: ElectronService,
    public readonly translateService: TranslateService,
    public readonly changeDetectorRef: ChangeDetectorRef,
    public readonly dialogRef: MatDialogRef<TooltipHelperComponent>,
  ) {}

  ngOnInit(): void {
    this.parseTooltip(this.message);
  }

  public openLink(link: string): void {
    if (link) {
      this.electronService.shell.openExternal(link);
    }
  }

  public parseTooltip(tooltipText: string): void {
    this.parsedTooltip = [];
    if (tooltipText.includes('](')) {
      this.parsedTooltip = this.parseTooltipText(tooltipText);
    } else {
      this.parsedTooltip.push({
        type: 'string',
        text: tooltipText,
      });
    }
    this.changeDetectorRef.markForCheck();
  }

  private parseTooltipText(tooltipText: string): TooltipPart[] {
    let parts = [];
    const result = tooltipText.split('](');
    const linkLabelEndIndex = tooltipText.indexOf('](');
    const linkLabelStartIndex = result[0].lastIndexOf('[');

    const text = tooltipText.substring(0, linkLabelStartIndex);
    if (text) {
      parts.push({type: 'string', text});
    }

    const label = tooltipText.substring(linkLabelStartIndex + 1, linkLabelEndIndex);
    const nextText = tooltipText.substring(linkLabelEndIndex + 2);
    const endOfLinkIndex = nextText.indexOf(')');
    const link = nextText.substring(0, endOfLinkIndex);
    if (link) {
      parts.push({type: 'link', text: label, link});
    }
    const restText = nextText.substring(endOfLinkIndex + 1);
    if (restText) {
      parts = [...parts, ...this.parseTooltipText(restText)];
    }
    return parts;
  }
}
