(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('rxjs/observable/fromEvent')) :
	typeof define === 'function' && define.amd ? define(['exports', '@angular/core', 'rxjs/observable/fromEvent'], factory) :
	(factory((global['angular2-customdraggable'] = {}),global.ng.core,global.Rx.Observable));
}(this, (function (exports,core,fromEvent) { 'use strict';

var Position = (function () {
    /**
     * @param {?} x
     * @param {?} y
     */
    function Position(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * @param {?} e
     * @param {?=} el
     * @return {?}
     */
    Position.fromEvent = function (e, el) {
        if (el === void 0) { el = null; }
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
            for (var /** @type {?} */ i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].target === el) {
                    return new Position(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                }
            }
        }
    };
    /**
     * @param {?} e
     * @return {?}
     */
    Position.isMouseEvent = function (e) {
        return Object.prototype.toString.apply(e).indexOf('MouseEvent') === 8;
    };
    /**
     * @param {?} obj
     * @return {?}
     */
    Position.isIPosition = function (obj) {
        return !!obj && ('x' in obj) && ('y' in obj);
    };
    /**
     * @param {?} el
     * @return {?}
     */
    Position.getCurrent = function (el) {
        var /** @type {?} */ pos = new Position(0, 0);
        if (window) {
            var /** @type {?} */ computed = window.getComputedStyle(el);
            if (computed) {
                var /** @type {?} */ x = parseInt(computed.getPropertyValue('left'), 10);
                var /** @type {?} */ y = parseInt(computed.getPropertyValue('top'), 10);
                pos.x = isNaN(x) ? 0 : x;
                pos.y = isNaN(y) ? 0 : y;
            }
            return pos;
        }
        else {
            console.error('Not Supported!');
            return null;
        }
    };
    /**
     * @param {?} p
     * @return {?}
     */
    Position.copy = function (p) {
        return new Position(0, 0).set(p);
    };
    Object.defineProperty(Position.prototype, "value", {
        /**
         * @return {?}
         */
        get: function () {
            return { x: this.x, y: this.y };
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @param {?} p
     * @return {?}
     */
    Position.prototype.add = function (p) {
        this.x += p.x;
        this.y += p.y;
        return this;
    };
    /**
     * @param {?} p
     * @return {?}
     */
    Position.prototype.subtract = function (p) {
        this.x -= p.x;
        this.y -= p.y;
        return this;
    };
    /**
     * @param {?} n
     * @return {?}
     */
    Position.prototype.multiply = function (n) {
        this.x *= n;
        this.y *= n;
    };
    /**
     * @param {?} n
     * @return {?}
     */
    Position.prototype.divide = function (n) {
        this.x /= n;
        this.y /= n;
    };
    /**
     * @return {?}
     */
    Position.prototype.reset = function () {
        this.x = 0;
        this.y = 0;
        return this;
    };
    /**
     * @param {?} p
     * @return {?}
     */
    Position.prototype.set = function (p) {
        this.x = p.x;
        this.y = p.y;
        return this;
    };
    return Position;
}());
var HelperBlock = (function () {
    /**
     * @param {?} parent
     * @param {?} renderer
     */
    function HelperBlock(parent, renderer) {
        this.parent = parent;
        this.renderer = renderer;
        this._added = false;
        // generate helper div
        var helper = renderer.createElement('div');
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
    HelperBlock.prototype.add = function () {
        // append div to parent
        if (this.parent && !this._added) {
            this.parent.appendChild(this._helper);
            this._added = true;
        }
    };
    /**
     * @return {?}
     */
    HelperBlock.prototype.remove = function () {
        if (this.parent && this._added) {
            this.parent.removeChild(this._helper);
            this._added = false;
        }
    };
    /**
     * @return {?}
     */
    HelperBlock.prototype.dispose = function () {
        this._helper = null;
        this._added = false;
    };
    Object.defineProperty(HelperBlock.prototype, "el", {
        /**
         * @return {?}
         */
        get: function () {
            return this._helper;
        },
        enumerable: true,
        configurable: true
    });
    return HelperBlock;
}());
var AngularDraggableDirective = (function () {
    /**
     * @param {?} el
     * @param {?} renderer
     */
    function AngularDraggableDirective(el, renderer) {
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
        this.started = new core.EventEmitter();
        this.stopped = new core.EventEmitter();
        this.edge = new core.EventEmitter();
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
        this.movingOffset = new core.EventEmitter();
        /**
         * Emit position offsets when put back
         */
        this.endOffset = new core.EventEmitter();
        this._helperBlock = new HelperBlock(el.nativeElement, renderer);
    }
    Object.defineProperty(AngularDraggableDirective.prototype, "zIndex", {
        /**
         * Set z-index when not dragging
         * @param {?} setting
         * @return {?}
         */
        set: function (setting) {
            this.renderer.setStyle(this.el.nativeElement, 'z-index', setting);
            this._zIndex = setting;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AngularDraggableDirective.prototype, "ngDraggable", {
        /**
         * @param {?} setting
         * @return {?}
         */
        set: function (setting) {
            if (setting !== undefined && setting !== null && setting !== '') {
                this.allowDrag = !!setting;
                var /** @type {?} */ element = this.getDragEl();
                if (this.allowDrag) {
                    this.renderer.addClass(element, 'ng-draggable');
                }
                else {
                    this.putBack();
                    this.renderer.removeClass(element, 'ng-draggable');
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    AngularDraggableDirective.prototype.ngOnInit = function () {
        if (this.allowDrag) {
            var /** @type {?} */ element = this.getDragEl();
            this.renderer.addClass(element, 'ng-draggable');
        }
        this.resetPosition();
    };
    /**
     * @return {?}
     */
    AngularDraggableDirective.prototype.ngOnDestroy = function () {
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
    };
    /**
     * @param {?} changes
     * @return {?}
     */
    AngularDraggableDirective.prototype.ngOnChanges = function (changes) {
        if (changes['position'] && !changes['position'].isFirstChange()) {
            var /** @type {?} */ p = changes['position'].currentValue;
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
    };
    /**
     * @return {?}
     */
    AngularDraggableDirective.prototype.ngAfterViewInit = function () {
        if (this.inBounds) {
            this.boundsCheck();
            this.oldTrans.add(this.tempTrans);
            this.tempTrans.reset();
        }
    };
    /**
     * @return {?}
     */
    AngularDraggableDirective.prototype.getDragEl = function () {
        return this.handle ? this.handle : this.el.nativeElement;
    };
    /**
     * @return {?}
     */
    AngularDraggableDirective.prototype.resetPosition = function () {
        if (Position.isIPosition(this.position)) {
            this.oldTrans.set(this.position);
        }
        else {
            this.oldTrans.reset();
        }
        this.tempTrans.reset();
        this.transform();
    };
    /**
     * @param {?} p
     * @return {?}
     */
    AngularDraggableDirective.prototype.moveTo = function (p) {
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
    };
    /**
     * @return {?}
     */
    AngularDraggableDirective.prototype.transform = function () {
        var /** @type {?} */ translateX = this.tempTrans.x + this.oldTrans.x;
        var /** @type {?} */ translateY = this.tempTrans.y + this.oldTrans.y;
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
        var /** @type {?} */ value = "translate(" + Math.round(translateX) + "px, " + Math.round(translateY) + "px)";
        this.renderer.setStyle(this.el.nativeElement, 'transform', value);
        this.renderer.setStyle(this.el.nativeElement, '-webkit-transform', value);
        this.renderer.setStyle(this.el.nativeElement, '-ms-transform', value);
        this.renderer.setStyle(this.el.nativeElement, '-moz-transform', value);
        this.renderer.setStyle(this.el.nativeElement, '-o-transform', value);
        // save current position
        this.currTrans.x = translateX;
        this.currTrans.y = translateY;
    };
    /**
     * @return {?}
     */
    AngularDraggableDirective.prototype.pickUp = function () {
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
            var /** @type {?} */ element = this.getDragEl();
            this.renderer.addClass(element, 'ng-dragging');
            /**
             * Fix performance issue:
             * https://github.com/xieziyu/angular2-draggable/issues/112
             */
            this.subscribeEvents();
        }
    };
    /**
     * @return {?}
     */
    AngularDraggableDirective.prototype.subscribeEvents = function () {
        var _this = this;
        this.draggingSub = fromEvent.fromEvent(document, 'mousemove', { passive: false }).subscribe(function (event) { return _this.onMouseMove(/** @type {?} */ (event)); });
        this.draggingSub.add(fromEvent.fromEvent(document, 'touchmove', { passive: false }).subscribe(function (event) { return _this.onMouseMove(/** @type {?} */ (event)); }));
        this.draggingSub.add(fromEvent.fromEvent(document, 'mouseup', { passive: false }).subscribe(function () { return _this.putBack(); }));
        // checking if browser is IE or Edge - https://github.com/xieziyu/angular2-draggable/issues/153
        var /** @type {?} */ isIEOrEdge = /msie\s|trident\//i.test(window.navigator.userAgent);
        if (!isIEOrEdge) {
            this.draggingSub.add(fromEvent.fromEvent(document, 'mouseleave', { passive: false }).subscribe(function () { return _this.putBack(); }));
        }
        this.draggingSub.add(fromEvent.fromEvent(document, 'touchend', { passive: false }).subscribe(function () { return _this.putBack(); }));
        this.draggingSub.add(fromEvent.fromEvent(document, 'touchcancel', { passive: false }).subscribe(function () { return _this.putBack(); }));
    };
    /**
     * @return {?}
     */
    AngularDraggableDirective.prototype.unsubscribeEvents = function () {
        this.draggingSub.unsubscribe();
        this.draggingSub = null;
    };
    /**
     * @return {?}
     */
    AngularDraggableDirective.prototype.boundsCheck = function () {
        if (this.bounds) {
            var /** @type {?} */ boundary = this.bounds.getBoundingClientRect();
            var /** @type {?} */ elem = this.el.nativeElement.getBoundingClientRect();
            var /** @type {?} */ result = {
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
    };
    /**
     * Get current offset
     * @return {?}
     */
    AngularDraggableDirective.prototype.getCurrentOffset = function () {
        return this.currTrans.value;
    };
    /**
     * @return {?}
     */
    AngularDraggableDirective.prototype.putBack = function () {
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
            var /** @type {?} */ element = this.getDragEl();
            this.renderer.removeClass(element, 'ng-dragging');
            /**
             * Fix performance issue:
             * https://github.com/xieziyu/angular2-draggable/issues/112
             */
            this.unsubscribeEvents();
        }
    };
    /**
     * @param {?} target
     * @param {?} element
     * @return {?}
     */
    AngularDraggableDirective.prototype.checkHandleTarget = function (target, element) {
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
        for (var /** @type {?} */ child in element.children) {
            if (element.children.hasOwnProperty(child)) {
                if (this.checkHandleTarget(target, element.children[child])) {
                    return true;
                }
            }
        }
        // Handle was not found in this lineage
        // Note: return false is ignore unless it is the parent element
        return false;
    };
    /**
     * @param {?} event
     * @return {?}
     */
    AngularDraggableDirective.prototype.onMouseDown = function (event) {
        // 1. skip right click;
        if (event instanceof MouseEvent && event.button === 2) {
            return;
        }
        // 2. if handle is set, the element can only be moved by handle
        var /** @type {?} */ target = event.target || event.srcElement;
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
    };
    /**
     * @param {?} event
     * @return {?}
     */
    AngularDraggableDirective.prototype.onMouseMove = function (event) {
        if (this.moving && this.allowDrag) {
            if (this.preventDefaultEvent) {
                event.stopPropagation();
                event.preventDefault();
            }
            // Add a transparent helper div:
            this._helperBlock.add();
            this.moveTo(Position.fromEvent(event, this.getDragEl()));
        }
    };
    AngularDraggableDirective.prototype.onMouseUp = function() {
        this.allowDrag = true; 
        $('#'+this.targetdiv).removeClass('dragging');
    };
    return AngularDraggableDirective;
}());
AngularDraggableDirective.decorators = [
    { type: core.Directive, args: [{
                selector: '[ngDraggable]',
                exportAs: 'ngDraggable'
            },] },
];
/**
 * @nocollapse
 */
AngularDraggableDirective.ctorParameters = function () { return [
    { type: core.ElementRef, },
    { type: core.Renderer2, },
]; };
AngularDraggableDirective.propDecorators = {
    'started': [{ type: core.Output },],
    'stopped': [{ type: core.Output },],
    'edge': [{ type: core.Output },],
    'handle': [{ type: core.Input },],
    'bounds': [{ type: core.Input },],
    'outOfBounds': [{ type: core.Input },],
    'gridSize': [{ type: core.Input },],
    'zIndexMoving': [{ type: core.Input },],
    'zIndex': [{ type: core.Input },],
    'inBounds': [{ type: core.Input },],
    'trackPosition': [{ type: core.Input },],
    'scale': [{ type: core.Input },],
    'preventDefaultEvent': [{ type: core.Input },],
    'position': [{ type: core.Input },],
    'lockAxis': [{ type: core.Input },],
    'movingOffset': [{ type: core.Output },],
    'endOffset': [{ type: core.Output },],
    'ngDraggable': [{ type: core.Input },],
    'onMouseDown': [{ type: core.HostListener, args: ['mousedown', ['$event'],] }, { type: core.HostListener, args: ['touchstart', ['$event'],] },],
    'onMouseUp': [{ type: HostListener,args: ['mouseup', ['$event'],]}, ]
};
var AngularDraggableModule = (function () {
    function AngularDraggableModule() {
    }
    return AngularDraggableModule;
}());
AngularDraggableModule.decorators = [
    { type: core.NgModule, args: [{
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
AngularDraggableModule.ctorParameters = function () { return []; };

exports.AngularDraggableModule = AngularDraggableModule;
exports.ɵa = AngularDraggableDirective;

Object.defineProperty(exports, '__esModule', { value: true });

})));

