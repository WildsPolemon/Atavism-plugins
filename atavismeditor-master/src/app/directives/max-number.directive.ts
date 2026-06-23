import {Directive, ElementRef, HostListener, Input} from '@angular/core';

@Directive({
  selector: '[maxNumber]',
})
export class MaxNumberDirective {
  @Input() maxNumber!: number;
  private inputElement: HTMLInputElement;

  constructor(public el: ElementRef) {
    this.inputElement = el.nativeElement;
  }

  @HostListener('input', ['$event']) onchange(): void {
    if (this.maxNumber) {
      const value: number = +this.inputElement.value;
      if (value > this.maxNumber) {
        this.inputElement.value = this.maxNumber as unknown as string;
        const evnt = new Event('input', {bubbles: true});
        this.inputElement.dispatchEvent(evnt);
      }
    }
  }
}
