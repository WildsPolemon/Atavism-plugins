import {AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Platform} from '@angular/cdk/platform';
import {fromEvent, Subject} from 'rxjs';
import {debounceTime, filter, takeUntil} from 'rxjs/operators';
import PerfectScrollbar from 'perfect-scrollbar';
// @ts-ignore
import * as _ from 'lodash';
import {
  FusePerfectScrollbarGeometry,
  FusePerfectScrollbarPosition,
} from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.interfaces';
import {FuseConfigService} from '@fuse/services/config.service';
import {FuseConfig} from '../../types';

@Directive({
  selector: '[fusePerfectScrollbar]',
})
export class FusePerfectScrollbarDirective implements OnInit, AfterViewInit, OnDestroy {
  isInitialized: boolean;
  isMobile: boolean;
  ps: PerfectScrollbar | any;

  // Private
  private _animation: number | null;
  private _enabled: boolean | '';
  private _debouncedUpdate: any;
  private _options: any;
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param elementRef
   * @param _fuseConfigService
   * @param _platform
   * @param _router
   */
  constructor(
    public elementRef: ElementRef,
    private _fuseConfigService: FuseConfigService,
    private _platform: Platform,
    private _router: Router
  ) {
    // Set the defaults
    this.isInitialized = false;
    this.isMobile = false;

    // Set the private defaults
    this._animation = null;
    this._enabled = false;
    this._debouncedUpdate = _.debounce(this.update, 150);
    this._options = {
      updateOnRouteChange: false,
    };
    this._unsubscribeAll = new Subject();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Perfect Scrollbar options
   *
   * @param value
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  @Input() set fusePerfectScrollbarOptions(value: any) {
    // Merge the options
    this._options = _.merge({}, this._options, value);

    // Destroy and re-init the PerfectScrollbar to update its options
    setTimeout(() => {
      this._destroy();
    });

    setTimeout(() => {
      this._init();
    });
  }

  get fusePerfectScrollbarOptions(): any {
    // Return the options
    return this._options;
  }

  /**
   * Is enabled
   *
   * @param value
   */
  @Input('fusePerfectScrollbar')
  set enabled(value: boolean | '') {
    // If nothing is provided with the directive (empty string),
    // we will take that as a true
    if (value === '') {
      value = true;
    }

    // Return, if both values are the same
    if (this.enabled === value) {
      return;
    }

    // Store the value
    this._enabled = value;

    // If enabled...
    if (this.enabled) {
      // Init the directive
      this._init();
    } else {
      // Otherwise destroy it
      this._destroy();
    }
  }

  get enabled(): boolean | '' {
    // Return the enabled status
    return this._enabled;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to window resize event
    fromEvent(window, 'resize')
      .pipe(takeUntil(this._unsubscribeAll), debounceTime(150))
      .subscribe(() => {
        // Update the PerfectScrollbar
        this.update();
      });
  }

  /**
   * After view init
   */
  ngAfterViewInit(): void {
    // Check if scrollbars enabled or not from the main config
    this._fuseConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((settings: FuseConfig) => {
      this.enabled = settings.customScrollbars;
    });

    // Scroll to the top on every route change
    if (this.fusePerfectScrollbarOptions.updateOnRouteChange) {
      this._router.events
        .pipe(
          takeUntil(this._unsubscribeAll),
          filter((event) => event instanceof NavigationEnd)
        )
        .subscribe(() => {
          setTimeout(() => {
            this.scrollToTop();
            this.update();
          }, 0);
        });
    }
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    this._destroy();

    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(void 0);
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Initialize
   *
   * @private
   */
  _init(): void {
    // Return, if already initialized
    if (this.isInitialized) {
      return;
    }

    // Check if is mobile
    if (this._platform.ANDROID || this._platform.IOS) {
      this.isMobile = true;
    }

    // Return if it's mobile
    if (this.isMobile) {
      // Return...
      return;
    }

    // Set as initialized
    this.isInitialized = true;

    // Initialize the perfect-scrollbar
    this.ps = new PerfectScrollbar(this.elementRef.nativeElement, {
      ...this.fusePerfectScrollbarOptions,
    });

    // Unbind 'keydown' events of PerfectScrollbar since it causes an extremely
    // high CPU usage on Angular Material inputs.
    // Loop through all the event elements of this PerfectScrollbar instance
    // @ts-ignore
    this.ps.event.eventElements.forEach((eventElement) => {
      // If we hit to the element with a 'keydown' event...
      if (typeof eventElement.handlers.keydown !== 'undefined') {
        // Unbind it
        eventElement.element.removeEventListener('keydown', eventElement.handlers.keydown[0]);
      }
    });
  }

  /**
   * Destroy
   *
   * @private
   */
  _destroy(): void {
    if (!this.isInitialized || !this.ps) {
      return;
    }

    // Destroy the perfect-scrollbar
    this.ps.destroy();

    // Clean up
    this.ps = null;
    this.isInitialized = false;
  }

  /**
   * Update scrollbars on window resize
   *
   * @private
   */
  @HostListener('window:resize')
  _updateOnResize(): void {
    this._debouncedUpdate();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Document click
   */
  @HostListener('document:click', ['$event'])
  documentClick(): void {
    if (!this.isInitialized || !this.ps) {
      return;
    }

    // Update the scrollbar on document click..
    // This isn't the most elegant solution but there is no other way
    // of knowing when the contents of the scrollable container changes.
    // Therefore, we update scrollbars on every document click.
    this.ps.update();
  }

  /**
   * Update the scrollbar
   */
  update(): void {
    if (!this.isInitialized) {
      return;
    }

    // Update the perfect-scrollbar
    this.ps.update();
  }

  /**
   * Destroy the scrollbar
   */
  destroy(): void {
    this.ngOnDestroy();
  }

  /**
   * Returns the geometry of the scrollable element
   *
   * @param prefix
   */
  geometry(prefix = 'scroll'): FusePerfectScrollbarGeometry {
    return new FusePerfectScrollbarGeometry(
      this.elementRef.nativeElement[prefix + 'Left'],
      this.elementRef.nativeElement[prefix + 'Top'],
      this.elementRef.nativeElement[prefix + 'Width'],
      this.elementRef.nativeElement[prefix + 'Height']
    );
  }

  /**
   * Returns the position of the scrollable element
   *
   * @param absolute
   */
  public position(absolute = false): FusePerfectScrollbarPosition {
    if (!absolute && this.ps) {
      return new FusePerfectScrollbarPosition(this.ps.reach.x || 0, this.ps.reach.y || 0);
    } else {
      return new FusePerfectScrollbarPosition(this.elementRef.nativeElement.scrollLeft, this.elementRef.nativeElement.scrollTop);
    }
  }

  /**
   * Scroll to X
   *
   * @param x
   * @param speed
   */
  public scrollToX(x: number, speed?: number): void {
    this.animateScrolling('scrollLeft', x, speed);
  }

  /**
   * Scroll to Y
   *
   * @param y
   * @param speed
   */
  public scrollToY(y: number, speed?: number): void {
    this.animateScrolling('scrollTop', y, speed);
  }

  /**
   * Scroll to top
   *
   * @param offset
   * @param speed
   */
  public scrollToTop(offset?: number, speed?: number): void {
    this.animateScrolling('scrollTop', offset || 0, speed);
  }

  /**
   * Scroll to left
   *
   * @param offset
   * @param speed
   */
  public scrollToLeft(offset?: number, speed?: number): void {
    this.animateScrolling('scrollLeft', offset || 0, speed);
  }

  /**
   * Scroll to element
   *
   * @param qs
   * @param offset
   * @param speed
   */
  public scrollToElement(qs: string, offset?: number, speed?: number): void {
    const element = this.elementRef.nativeElement.querySelector(qs);

    if (!element) {
      return;
    }

    const elementPos = element.getBoundingClientRect();
    const scrollerPos = this.elementRef.nativeElement.getBoundingClientRect();

    if (this.elementRef.nativeElement.classList.contains('ps--active-x')) {
      const currentPos = this.elementRef.nativeElement.scrollLeft;
      const position = elementPos.left - scrollerPos.left + currentPos;

      this.animateScrolling('scrollLeft', position + (offset || 0), speed);
    }

    if (this.elementRef.nativeElement.classList.contains('ps--active-y')) {
      const currentPos = this.elementRef.nativeElement.scrollTop;
      const position = elementPos.top - scrollerPos.top + currentPos;

      this.animateScrolling('scrollTop', position + (offset || 0), speed);
    }
  }

  /**
   * Animate scrolling
   *
   * @param target
   * @param value
   * @param speed
   */
  public animateScrolling(target: string, value: number, speed?: number): void {
    if (this._animation) {
      window.cancelAnimationFrame(this._animation);
      this._animation = null;
    }

    if (!speed || typeof window === 'undefined') {
      this.elementRef.nativeElement[target] = value;
    } else if (value !== this.elementRef.nativeElement[target]) {
      let newValue = 0;
      let scrollCount = 0;

      let oldTimestamp = performance.now();
      let oldValue = this.elementRef.nativeElement[target];

      const cosParameter = (oldValue - value) / 2;

      const step = (newTimestamp: number) => {
        scrollCount += Math.PI / (speed / (newTimestamp - oldTimestamp));
        newValue = Math.round(value + cosParameter + cosParameter * Math.cos(scrollCount));

        // Only continue animation if scroll position has not changed
        if (this.elementRef.nativeElement[target] === oldValue) {
          if (scrollCount >= Math.PI) {
            this.animateScrolling(target, value, 0);
          } else {
            this.elementRef.nativeElement[target] = newValue;

            // On a zoomed out page the resulting offset may differ
            oldValue = this.elementRef.nativeElement[target];
            oldTimestamp = newTimestamp;

            this._animation = window.requestAnimationFrame(step);
          }
        }
      };

      window.requestAnimationFrame(step);
    }
  }
}
