import {Directive, ElementRef, HostListener, Input} from '@angular/core';

@Directive({
  selector: '[digitOnly]',
})
export class DigitOnlyDirective {
  private decimalCounter = 0;
  private navigationKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'Home',
    'End',
    'ArrowLeft',
    'ArrowRight',
    'Clear',
    'Copy',
    'Paste',
  ];
  @Input() decimal? = false;
  inputElement: HTMLInputElement;

  constructor(public el: ElementRef) {
    this.inputElement = el.nativeElement;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (
      this.navigationKeys.indexOf(e.key) > -1 ||
      (e.key === 'a' && e.ctrlKey) ||
      (e.key === 'c' && e.ctrlKey) ||
      (e.key === 'v' && e.ctrlKey) ||
      (e.key === 'x' && e.ctrlKey) ||
      (e.key === 'a' && e.metaKey) ||
      (e.key === 'c' && e.metaKey) ||
      (e.key === 'v' && e.metaKey) ||
      (e.key === 'x' && e.metaKey) ||
      (e.key === '-' && (e.target as any).selectionStart === 0) ||
      (this.decimal && e.key === '.' && this.decimalCounter < 1) // Allow: only one decimal point
    ) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if (e.key === ' ' || isNaN(Number(e.key))) {
      e.preventDefault();
    }
  }

  @HostListener('keyup', ['$event'])
  onKeyUp(): void {
    if (!this.decimal) {
      return;
    } else {
      this.decimalCounter = this.el.nativeElement.value.split('.').length - 1;
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    let pastedInput: string = (event.clipboardData as DataTransfer).getData('text/plain');
    let pasted = false;
    if (this.decimal) {
      if (isNaN(parseFloat(pastedInput))) {
        event.preventDefault();
        return;
      }
      pastedInput = '' + parseFloat(pastedInput);
    }
    if (!this.decimal) {
      pasted = document.execCommand('insertText', false, pastedInput.replace(/[^\-?\d]/g, ''));
    } else if (this.isValidDecimal(pastedInput)) {
      // eslint-disable-next-line
      pasted = document.execCommand('insertText', false, pastedInput.replace(/[^\-?\.?\d]/g, ''));
    }
    if (pasted) {
      event.preventDefault();
      return;
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(pastedInput);
        document.execCommand('paste');
      }
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    let textData = (event.dataTransfer as DataTransfer).getData('text');
    this.inputElement.focus();
    let pasted = false;
    if (this.decimal) {
      if (isNaN(parseFloat(textData))) {
        event.preventDefault();
        return;
      }
      textData = '' + parseFloat(textData);
    }
    if (!this.decimal) {
      pasted = document.execCommand('insertText', false, textData.replace(/[^\-?\d]/g, ''));
    } else if (this.isValidDecimal(textData)) {
      // eslint-disable-next-line
      pasted = document.execCommand('insertText', false, textData.replace(/[^\-?\.?\d]/g, ''));
    }
    if (pasted) {
      event.preventDefault();
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(textData);
        document.execCommand('paste');
      }
    }
  }

  private isValidDecimal(string: string): boolean {
    return string.split('.').length <= 2;
  }
}
