import { Directive, ElementRef, EventEmitter, HostListener, Input, NgModule, Output, Renderer2 } from '@angular/core';
import { fromEvent as fromEvent$1 } from 'rxjs/observable/fromEvent';

class Position {
    /**
     * @param {?} x
     * @param {?} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * @param {?} e
     * @param {?=} el
     * @return {?}
     */
    static fromEvent(e, el = null) {
        /**
         * Fix issue: Resize doesn't work on Windows10 IE11 (and on some windows 7 IE11)
         * https://github.com/xieziyu/angular2-draggable/issues/164
         * e instanceof MouseEvent check returns false on IE11
         */
        if (this.isMouseEvent(e)) {
            return new Position(e.clientX, e.clientY);
        }
        else {
            if (el === null || e.changedTouches.length === 1) {
                return new Position(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
            /**
             * Fix issue: Multiple phone draggables at the same time
             * https://github.com/xieziyu/angular2-draggable/issues/128
             */
            for (let /** @type {?} */ i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].target === el) {
                    return new Position(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                }
            }
        }
    }
    /**
     * @param {?} e
     * @return {?}
     */
    static isMouseEvent(e) {
        return Object.prototype.toString.apply(e).indexOf('MouseEvent') === 8;
    }
    /**
     * @param {?} obj
     * @return {?}
     */
    static isIPosition(obj) {
        return !!obj && ('x' in obj) && ('y' in obj);
    }
    /**
     * @param {?} el
     * @return {?}
     */
    static getCurrent(el) {
        let /** @type {?} */ pos = new Position(0, 0);
        if (window) {
            const /** @type {?} */ computed = window.getComputedStyle(el);
            if (computed) {
                let /** @type {?} */ x = parseInt(computed.getPropertyValue('left'), 10);
                let /** @type {?} */ y = parseInt(computed.getPropertyValue('top'), 10);
                pos.x = isNaN(x) ? 0 : x;
                pos.y = isNaN(y) ? 0 : y;
            }
            return pos;
        }
        else {
            console.error('Not Supported!');
            return null;
        }
    }
    /**
     * @param {?} p
     * @return {?}
     */
    static copy(p) {
        return new Position(0, 0).set(p);
    }
    /**
     * @return {?}
     */
    get value() {
        return { x: this.x, y: this.y };
    }
    /**
     * @param {?} p
     * @return {?}
     */
    add(p) {
        this.x += p.x;
        this.y += p.y;
        return this;
    }
    /**
     * @param {?} p
     * @return {?}
     */
    subtract(p) {
        this.x -= p.x;
        this.y -= p.y;
        return this;
    }
    /**
     * @param {?} n
     * @return {?}
     */
    multiply(n) {
        this.x *= n;
        this.y *= n;
    }
    /**
     * @param {?} n
     * @return {?}
     */
    divide(n) {
        this.x /= n;
        this.y /= n;
    }
    /**
     * @return {?}
     */
    reset() {
        this.x = 0;
        this.y = 0;
        return this;
    }
    /**
     * @param {?} p
     * @return {?}
     */
    set(p) {
        this.x = p.x;
        this.y = p.y;
        return this;
    }
}

class HelperBlock {
    /**
     * @param {?} parent
     * @param {?} renderer
     */
    constructor(parent, renderer) {
        this.parent = parent;
        this.renderer = renderer;
        this._added = false;
        // generate helper div
        let helper = renderer.createElement('div');
        renderer.setStyle(helper, 'position', 'absolute');
        renderer.setStyle(helper, 'width', '100%');
        renderer.setStyle(helper, 'height', '100%');
        renderer.setStyle(helper, 'background-color', 'transparent');
        renderer.setStyle(helper, 'top', '0');
        renderer.setStyle(helper, 'left', '0');
        // done
        this._helper = helper;
    }
    /**
     * @return {?}
     */
    add() {
        // append div to parent
        if (this.parent && !this._added) {
            this.parent.appendChild(this._helper);
            this._added = true;
        }
    }
    /**
     * @return {?}
     */
    remove() {
        if (this.parent && this._added) {
            this.parent.removeChild(this._helper);
            this._added = false;
        }
    }
    /**
     * @return {?}
     */
    dispose() {
        this._helper = null;
        this._added = false;
    }
    /**
     * @return {?}
     */
    get el() {
        return this._helper;
    }
}

class AngularDraggableDirective {
    /**
     * @param {?} el
     * @param {?} renderer
     */
    constructor(el, renderer) {
        this.el = el;
        this.renderer = renderer;
        this.allowDrag = true;
        this.moving = false;
        this.orignal = null;
        this.oldTrans = new Position(0, 0);
        this.tempTrans = new Position(0, 0);
        this.currTrans = new Position(0, 0);
        this.oldZIndex = '';
        this._zIndex = '';
        this.needTransform = false;
        this.draggingSub = null;
        /**
         * Bugfix: iFrames, and context unrelated elements block all events, and are unusable
         * https://github.com/xieziyu/angular2-draggable/issues/84
         */
        this._helperBlock = null;
        this.started = new EventEmitter();
        this.stopped = new EventEmitter();
        this.edge = new EventEmitter();
        /**
         * List of allowed out of bounds edges *
         */
        this.outOfBounds = {
            top: false,
            right: false,
            bottom: false,
            left: false
        };
        /**
         * Round the position to nearest grid
         */
        this.gridSize = 1;
        /**
         * Whether to limit the element stay in the bounds
         */
        this.inBounds = false;
        /**
         * Whether the element should use it's previous drag position on a new drag event.
         */
        this.trackPosition = true;
        /**
         * Input css scale transform of element so translations are correct
         */
        this.scale = 1;
        /**
         * Whether to prevent default event
         */
        this.preventDefaultEvent = false;
        /**
         * Set initial position by offsets
         */
        this.position = { x: 0, y: 0 };
        /**
         * Lock axis: 'x' or 'y'
         */
        this.lockAxis = null;
        /**
         * Emit position offsets when moving
         */
        this.movingOffset = new EventEmitter();
        /**
         * Emit position offsets when put back
         */
        this.endOffset = new EventEmitter();
        this._helperBlock = new HelperBlock(el.nativeElement, renderer);
    }
    /**
     * Set z-index when not dragging
     * @param {?} setting
     * @return {?}
     */
    set zIndex(setting) {
        this.renderer.setStyle(this.el.nativeElement, 'z-index', setting);
        this._zIndex = setting;
    }
    /**
     * @param {?} setting
     * @return {?}
     */
    set ngDraggable(setting) {
        if (setting !== undefined && setting !== null && setting !== '') {
            this.allowDrag = !!setting;
            let /** @type {?} */ element = this.getDragEl();
            if (this.allowDrag) {
                this.renderer.addClass(element, 'ng-draggable');
            }
            else {
                this.putBack();
                this.renderer.removeClass(element, 'ng-draggable');
            }
        }
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        if (this.allowDrag) {
            let /** @type {?} */ element = this.getDragEl();
            this.renderer.addClass(element, 'ng-draggable');
        }
        this.resetPosition();
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this.bounds = null;
        this.handle = null;
        this.orignal = null;
        this.oldTrans = null;
        this.tempTrans = null;
        this.currTrans = null;
        this._helperBlock.dispose();
        this._helperBlock = null;
        if (this.draggingSub) {
            this.draggingSub.unsubscribe();
        }
    }
    /**
     * @param {?} changes
     * @return {?}
     */
    ngOnChanges(changes) {
        if (changes['position'] && !changes['position'].isFirstChange()) {
            let /** @type {?} */ p = changes['position'].currentValue;
            if (!this.moving) {
                if (Position.isIPosition(p)) {
                    this.oldTrans.set(p);
                }
                else {
                    this.oldTrans.reset();
                }
                this.transform();
            }
            else {
                this.needTransform = true;
            }
        }
    }
    /**
     * @return {?}
     */
    ngAfterViewInit() {
        if (this.inBounds) {
            this.boundsCheck();
            this.oldTrans.add(this.tempTrans);
            this.tempTrans.reset();
        }
    }
    /**
     * @return {?}
     */
    getDragEl() {
        return this.handle ? this.handle : this.el.nativeElement;
    }
    /**
     * @return {?}
     */
    resetPosition() {
        if (Position.isIPosition(this.position)) {
            this.oldTrans.set(this.position);
        }
        else {
            this.oldTrans.reset();
        }
        this.tempTrans.reset();
        this.transform();
    }
    /**
     * @param {?} p
     * @return {?}
     */
    moveTo(p) {
        if (this.orignal) {
            p.subtract(this.orignal);
            this.tempTrans.set(p);
            this.tempTrans.divide(this.scale);
            this.transform();
            if (this.bounds) {
                this.edge.emit(this.boundsCheck());
            }
            this.movingOffset.emit(this.currTrans.value);
        }
    }
    /**
     * @return {?}
     */
    transform() {
        let /** @type {?} */ translateX = this.tempTrans.x + this.oldTrans.x;
        let /** @type {?} */ translateY = this.tempTrans.y + this.oldTrans.y;
        if (this.lockAxis === 'x') {
            translateX = this.oldTrans.x;
            this.tempTrans.x = 0;
        }
        else if (this.lockAxis === 'y') {
            translateY = this.oldTrans.y;
            this.tempTrans.y = 0;
        }
        // Snap to grid: by grid size
        if (this.gridSize > 1) {
            translateX = Math.round(translateX / this.gridSize) * this.gridSize;
            translateY = Math.round(translateY / this.gridSize) * this.gridSize;
        }
        let /** @type {?} */ value = `translate(${Math.round(translateX)}px, ${Math.round(translateY)}px)`;
        this.renderer.setStyle(this.el.nativeElement, 'transform', value);
        this.renderer.setStyle(this.el.nativeElement, '-webkit-transform', value);
        this.renderer.setStyle(this.el.nativeElement, '-ms-transform', value);
        this.renderer.setStyle(this.el.nativeElement, '-moz-transform', value);
        this.renderer.setStyle(this.el.nativeElement, '-o-transform', value);
        // save current position
        this.currTrans.x = translateX;
        this.currTrans.y = translateY;
    }
    /**
     * @return {?}
     */
    pickUp() {
        // get old z-index:
        this.oldZIndex = this.el.nativeElement.style.zIndex ? this.el.nativeElement.style.zIndex : '';
        if (window) {
            this.oldZIndex = window.getComputedStyle(this.el.nativeElement, null).getPropertyValue('z-index');
        }
        if (this.zIndexMoving) {
            this.renderer.setStyle(this.el.nativeElement, 'z-index', this.zIndexMoving);
        }
        if (!this.moving) {
            this.started.emit(this.el.nativeElement);
            this.moving = true;
            const /** @type {?} */ element = this.getDragEl();
            this.renderer.addClass(element, 'ng-dragging');
            /**
             * Fix performance issue:
             * https://github.com/xieziyu/angular2-draggable/issues/112
             */
            this.subscribeEvents();
        }
    }
    /**
     * @return {?}
     */
    subscribeEvents() {
        this.draggingSub = fromEvent$1(document, 'mousemove', { passive: false }).subscribe(event => this.onMouseMove(/** @type {?} */ (event)));
        this.draggingSub.add(fromEvent$1(document, 'touchmove', { passive: false }).subscribe(event => this.onMouseMove(/** @type {?} */ (event))));
        this.draggingSub.add(fromEvent$1(document, 'mouseup', { passive: false }).subscribe(() => this.putBack()));
        // checking if browser is IE or Edge - https://github.com/xieziyu/angular2-draggable/issues/153
        let /** @type {?} */ isIEOrEdge = /msie\s|trident\//i.test(window.navigator.userAgent);
        if (!isIEOrEdge) {
            this.draggingSub.add(fromEvent$1(document, 'mouseleave', { passive: false }).subscribe(() => this.putBack()));
        }
        this.draggingSub.add(fromEvent$1(document, 'touchend', { passive: false }).subscribe(() => this.putBack()));
        this.draggingSub.add(fromEvent$1(document, 'touchcancel', { passive: false }).subscribe(() => this.putBack()));
    }
    /**
     * @return {?}
     */
    unsubscribeEvents() {
        this.draggingSub.unsubscribe();
        this.draggingSub = null;
    }
    /**
     * @return {?}
     */
    boundsCheck() {
        if (this.bounds) {
            let /** @type {?} */ boundary = this.bounds.getBoundingClientRect();
            let /** @type {?} */ elem = this.el.nativeElement.getBoundingClientRect();
            let /** @type {?} */ result = {
                'top': this.outOfBounds.top ? true : boundary.top < elem.top,
                'right': this.outOfBounds.right ? true : boundary.right > elem.right,
                'bottom': this.outOfBounds.bottom ? true : boundary.bottom > elem.bottom,
                'left': this.outOfBounds.left ? true : boundary.left < elem.left
            };
            if (this.inBounds) {
                if (!result.top) {
                    this.tempTrans.y -= (elem.top - boundary.top) / this.scale;
                }
                if (!result.bottom) {
                    this.tempTrans.y -= (elem.bottom - boundary.bottom) / this.scale;
                }
                if (!result.right) {
                    this.tempTrans.x -= (elem.right - boundary.right) / this.scale;
                }
                if (!result.left) {
                    this.tempTrans.x -= (elem.left - boundary.left) / this.scale;
                }
                this.transform();
            }
            return result;
        }
    }
    /**
     * Get current offset
     * @return {?}
     */
    getCurrentOffset() {
        return this.currTrans.value;
    }
    /**
     * @return {?}
     */
    putBack() {
        if (this._zIndex) {
            this.renderer.setStyle(this.el.nativeElement, 'z-index', this._zIndex);
        }
        else if (this.zIndexMoving) {
            if (this.oldZIndex) {
                this.renderer.setStyle(this.el.nativeElement, 'z-index', this.oldZIndex);
            }
            else {
                this.el.nativeElement.style.removeProperty('z-index');
            }
        }
        if (this.moving) {
            this.stopped.emit(this.el.nativeElement);
            // Remove the helper div:
            this._helperBlock.remove();
            if (this.needTransform) {
                if (Position.isIPosition(this.position)) {
                    this.oldTrans.set(this.position);
                }
                else {
                    this.oldTrans.reset();
                }
                this.transform();
                this.needTransform = false;
            }
            if (this.bounds) {
                this.edge.emit(this.boundsCheck());
            }
            this.moving = false;
            this.endOffset.emit(this.currTrans.value);
            if (this.trackPosition) {
                this.oldTrans.add(this.tempTrans);
            }
            this.tempTrans.reset();
            if (!this.trackPosition) {
                this.transform();
            }
            const /** @type {?} */ element = this.getDragEl();
            this.renderer.removeClass(element, 'ng-dragging');
            /**
             * Fix performance issue:
             * https://github.com/xieziyu/angular2-draggable/issues/112
             */
            this.unsubscribeEvents();
        }
    }
    /**
     * @param {?} target
     * @param {?} element
     * @return {?}
     */
    checkHandleTarget(target, element) {
        // Checks if the target is the element clicked, then checks each child element of element as well
        // Ignores button clicks
        // Ignore elements of type button
        if (element.tagName === 'BUTTON') {
            return false;
        }
        // If the target was found, return true (handle was found)
        if (element === target) {
            return true;
        }
        // Recursively iterate this elements children
        for (let /** @type {?} */ child in element.children) {
            if (element.children.hasOwnProperty(child)) {
                if (this.checkHandleTarget(target, element.children[child])) {
                    return true;
                }
            }
        }
        // Handle was not found in this lineage
        // Note: return false is ignore unless it is the parent element
        return false;
    }
    /**
     * @param {?} event
     * @return {?}
     */
    onMouseDown(event) {
        // 1. skip right click;
        if (event instanceof MouseEvent && event.button === 2) {
            return;
        }
        // 2. if handle is set, the element can only be moved by handle
        let /** @type {?} */ target = event.target || event.srcElement;
        if (this.handle !== undefined && !this.checkHandleTarget(target, this.handle)) {
            return;
        }
        // 3. if allow drag is set to false, ignore the mousedown
        if (this.allowDrag === false) {
            return;
        }
        if (this.preventDefaultEvent) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.orignal = Position.fromEvent(event, this.getDragEl());
        this.pickUp();
    }
    /**
     * @param {?} event
     * @return {?}
     */
    onMouseMove(event) {
        if (this.moving && this.allowDrag) {
            if (this.preventDefaultEvent) {
                event.stopPropagation();
                event.preventDefault();
            }
            // Add a transparent helper div:
            this._helperBlock.add();
            this.moveTo(Position.fromEvent(event, this.getDragEl()));
        }
    }
}
AngularDraggableDirective.decorators = [
    { type: Directive, args: [{
                selector: '[ngDraggable]',
                exportAs: 'ngDraggable'
            },] },
];
/**
 * @nocollapse
 */
AngularDraggableDirective.ctorParameters = () => [
    { type: ElementRef, },
    { type: Renderer2, },
];
AngularDraggableDirective.propDecorators = {
    'started': [{ type: Output },],
    'stopped': [{ type: Output },],
    'edge': [{ type: Output },],
    'handle': [{ type: Input },],
    'bounds': [{ type: Input },],
    'outOfBounds': [{ type: Input },],
    'gridSize': [{ type: Input },],
    'zIndexMoving': [{ type: Input },],
    'zIndex': [{ type: Input },],
    'inBounds': [{ type: Input },],
    'trackPosition': [{ type: Input },],
    'scale': [{ type: Input },],
    'preventDefaultEvent': [{ type: Input },],
    'position': [{ type: Input },],
    'lockAxis': [{ type: Input },],
    'movingOffset': [{ type: Output },],
    'endOffset': [{ type: Output },],
    'ngDraggable': [{ type: Input },],
    'onMouseDown': [{ type: HostListener, args: ['mousedown', ['$event'],] }, { type: HostListener, args: ['touchstart', ['$event'],] },],
};

class AngularDraggableModule {
}
AngularDraggableModule.decorators = [
    { type: NgModule, args: [{
                imports: [],
                declarations: [
                    AngularDraggableDirective,
                ],
                exports: [
                    AngularDraggableDirective,
                ]
            },] },
];
/**
 * @nocollapse
 */
AngularDraggableModule.ctorParameters = () => [];

/**
 * Generated bundle index. Do not edit.
 */

export { AngularDraggableModule, AngularDraggableDirective as ɵa };
//# sourceMappingURL=angular2-draggable.js.map
