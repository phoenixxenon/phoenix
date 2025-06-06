(function() {
    function r(e, n, t) {
        function o(i, f) {
            if (!n[i]) {
                if (!e[i]) {
                    var c = "function" == typeof require && require;
                    if (!f && c) return c(i, !0);
                    if (u) return u(i, !0);
                    var a = new Error("Cannot find module '" + i + "'");
                    throw a.code = "MODULE_NOT_FOUND", a
                }
                var p = n[i] = {
                    exports: {}
                };
                e[i][0].call(p.exports, function(r) {
                    var n = e[i][1][r];
                    return o(n || r)
                }, p, p.exports, r, e, n, t)
            }
            return n[i].exports
        }
        for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
        return o
    }
    return r
})()({
    1: [function(require, module, exports) {
        var Shape = require("./shape");
        var utils = require("./utils");
        var Circle = function Circle(container, options) {
            this._pathTemplate = "M 50,50 m 0,-{radius}" + " a {radius},{radius} 0 1 1 0,{2radius}" + " a {radius},{radius} 0 1 1 0,-{2radius}";
            this.containerAspectRatio = 1;
            Shape.apply(this, arguments)
        };
        Circle.prototype = new Shape;
        Circle.prototype.constructor = Circle;
        Circle.prototype._pathString = function _pathString(opts) {
            var widthOfWider = opts.strokeWidth;
            if (opts.trailWidth && opts.trailWidth > opts.strokeWidth) {
                widthOfWider = opts.trailWidth
            }
            var r = 50 - widthOfWider / 2;
            return utils.render(this._pathTemplate, {
                radius: r,
                "2radius": r * 2
            })
        };
        Circle.prototype._trailString = function _trailString(opts) {
            return this._pathString(opts)
        };
        module.exports = Circle
    }, {
        "./shape": 6,
        "./utils": 8
    }],
    2: [function(require, module, exports) {
        var Shape = require("./shape");
        var utils = require("./utils");
        var Line = function Line(container, options) {
            this._pathTemplate = "M 0,{center} L 100,{center}";
            Shape.apply(this, arguments)
        };
        Line.prototype = new Shape;
        Line.prototype.constructor = Line;
        Line.prototype._initializeSvg = function _initializeSvg(svg, opts) {
            svg.setAttribute("viewBox", "0 0 100 " + opts.strokeWidth);
            svg.setAttribute("preserveAspectRatio", "none")
        };
        Line.prototype._pathString = function _pathString(opts) {
            return utils.render(this._pathTemplate, {
                center: opts.strokeWidth / 2
            })
        };
        Line.prototype._trailString = function _trailString(opts) {
            return this._pathString(opts)
        };
        module.exports = Line
    }, {
        "./shape": 6,
        "./utils": 8
    }],
    3: [function(require, module, exports) {
        module.exports = {
            Line: require("./line"),
            Circle: require("./circle"),
            SemiCircle: require("./semicircle"),
            Square: require("./square"),
            Path: require("./path"),
            Shape: require("./shape"),
            utils: require("./utils")
        }
    }, {
        "./circle": 1,
        "./line": 2,
        "./path": 4,
        "./semicircle": 5,
        "./shape": 6,
        "./square": 7,
        "./utils": 8
    }],
    4: [function(require, module, exports) {
        var shifty = require("shifty");
        var utils = require("./utils");
        var Tweenable = shifty.Tweenable;
        var EASING_ALIASES = {
            easeIn: "easeInCubic",
            easeOut: "easeOutCubic",
            easeInOut: "easeInOutCubic"
        };
        var Path = function Path(path, opts) {
            if (!(this instanceof Path)) {
                throw new Error("Constructor was called without new keyword")
            }
            opts = utils.extend({
                delay: 0,
                duration: 800,
                easing: "linear",
                from: {},
                to: {},
                step: function() {}
            }, opts);
            var element;
            if (utils.isString(path)) {
                element = document.querySelector(path)
            } else {
                element = path
            }
            this.path = element;
            this._opts = opts;
            this._tweenable = null;
            var length = this.path.getTotalLength();
            this.path.style.strokeDasharray = length + " " + length;
            this.set(0)
        };
        Path.prototype.value = function value() {
            var offset = this._getComputedDashOffset();
            var length = this.path.getTotalLength();
            var progress = 1 - offset / length;
            return parseFloat(progress.toFixed(6), 10)
        };
        Path.prototype.set = function set(progress) {
            this.stop();
            this.path.style.strokeDashoffset = this._progressToOffset(progress);
            var step = this._opts.step;
            if (utils.isFunction(step)) {
                var easing = this._easing(this._opts.easing);
                var values = this._calculateTo(progress, easing);
                var reference = this._opts.shape || this;
                step(values, reference, this._opts.attachment)
            }
        };
        Path.prototype.stop = function stop() {
            this._stopTween();
            this.path.style.strokeDashoffset = this._getComputedDashOffset()
        };
        Path.prototype.animate = function animate(progress, opts, cb) {
            opts = opts || {};
            if (utils.isFunction(opts)) {
                cb = opts;
                opts = {}
            }
            var passedOpts = utils.extend({}, opts);
            var defaultOpts = utils.extend({}, this._opts);
            opts = utils.extend(defaultOpts, opts);
            var shiftyEasing = this._easing(opts.easing);
            var values = this._resolveFromAndTo(progress, shiftyEasing, passedOpts);
            this.stop();
            this.path.getBoundingClientRect();
            var offset = this._getComputedDashOffset();
            var newOffset = this._progressToOffset(progress);
            var self = this;
            this._tweenable = new Tweenable;
            this._tweenable.tween({
                from: utils.extend({
                    offset: offset
                }, values.from),
                to: utils.extend({
                    offset: newOffset
                }, values.to),
                duration: opts.duration,
                delay: opts.delay,
                easing: shiftyEasing,
                step: function(state) {
                    self.path.style.strokeDashoffset = state.offset;
                    var reference = opts.shape || self;
                    opts.step(state, reference, opts.attachment)
                }
            }).then(function(state) {
                if (utils.isFunction(cb)) {
                    cb()
                }
            })
        };
        Path.prototype._getComputedDashOffset = function _getComputedDashOffset() {
            var computedStyle = window.getComputedStyle(this.path, null);
            return parseFloat(computedStyle.getPropertyValue("stroke-dashoffset"), 10)
        };
        Path.prototype._progressToOffset = function _progressToOffset(progress) {
            var length = this.path.getTotalLength();
            return length - progress * length
        };
        Path.prototype._resolveFromAndTo = function _resolveFromAndTo(progress, easing, opts) {
            if (opts.from && opts.to) {
                return {
                    from: opts.from,
                    to: opts.to
                }
            }
            return {
                from: this._calculateFrom(easing),
                to: this._calculateTo(progress, easing)
            }
        };
        Path.prototype._calculateFrom = function _calculateFrom(easing) {
            return shifty.interpolate(this._opts.from, this._opts.to, this.value(), easing)
        };
        Path.prototype._calculateTo = function _calculateTo(progress, easing) {
            return shifty.interpolate(this._opts.from, this._opts.to, progress, easing)
        };
        Path.prototype._stopTween = function _stopTween() {
            if (this._tweenable !== null) {
                this._tweenable.stop();
                this._tweenable = null
            }
        };
        Path.prototype._easing = function _easing(easing) {
            if (EASING_ALIASES.hasOwnProperty(easing)) {
                return EASING_ALIASES[easing]
            }
            return easing
        };
        module.exports = Path
    }, {
        "./utils": 8,
        shifty: 9
    }],
    5: [function(require, module, exports) {
        var Shape = require("./shape");
        var Circle = require("./circle");
        var utils = require("./utils");
        var SemiCircle = function SemiCircle(container, options) {
            this._pathTemplate = "M 50,50 m -{radius},0" + " a {radius},{radius} 0 1 1 {2radius},0";
            this.containerAspectRatio = 2;
            Shape.apply(this, arguments)
        };
        SemiCircle.prototype = new Shape;
        SemiCircle.prototype.constructor = SemiCircle;
        SemiCircle.prototype._initializeSvg = function _initializeSvg(svg, opts) {
            svg.setAttribute("viewBox", "0 0 100 50")
        };
        SemiCircle.prototype._initializeTextContainer = function _initializeTextContainer(opts, container, textContainer) {
            if (opts.text.style) {
                textContainer.style.top = "auto";
                textContainer.style.bottom = "0";
                if (opts.text.alignToBottom) {
                    utils.setStyle(textContainer, "transform", "translate(-50%, 0)")
                } else {
                    utils.setStyle(textContainer, "transform", "translate(-50%, 50%)")
                }
            }
        };
        SemiCircle.prototype._pathString = Circle.prototype._pathString;
        SemiCircle.prototype._trailString = Circle.prototype._trailString;
        module.exports = SemiCircle
    }, {
        "./circle": 1,
        "./shape": 6,
        "./utils": 8
    }],
    6: [function(require, module, exports) {
        var Path = require("./path");
        var utils = require("./utils");
        var DESTROYED_ERROR = "Object is destroyed";
        var Shape = function Shape(container, opts) {
            if (!(this instanceof Shape)) {
                throw new Error("Constructor was called without new keyword")
            }
            if (arguments.length === 0) {
                return
            }
            this._opts = utils.extend({
                color: "#555",
                strokeWidth: 1,
                trailColor: null,
                trailWidth: null,
                fill: null,
                text: {
                    style: {
                        color: null,
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        padding: 0,
                        margin: 0,
                        transform: {
                            prefix: true,
                            value: "translate(-50%, -50%)"
                        }
                    },
                    autoStyleContainer: true,
                    alignToBottom: true,
                    value: null,
                    className: "progressbar-text"
                },
                svgStyle: {
                    display: "block",
                    width: "100%"
                },
                warnings: false
            }, opts, true);
            if (utils.isObject(opts) && opts.svgStyle !== undefined) {
                this._opts.svgStyle = opts.svgStyle
            }
            if (utils.isObject(opts) && utils.isObject(opts.text) && opts.text.style !== undefined) {
                this._opts.text.style = opts.text.style
            }
            var svgView = this._createSvgView(this._opts);
            var element;
            if (utils.isString(container)) {
                element = document.querySelector(container)
            } else {
                element = container
            }
            if (!element) {
                throw new Error("Container does not exist: " + container)
            }
            this._container = element;
            this._container.appendChild(svgView.svg);
            if (this._opts.warnings) {
                this._warnContainerAspectRatio(this._container)
            }
            if (this._opts.svgStyle) {
                utils.setStyles(svgView.svg, this._opts.svgStyle)
            }
            this.svg = svgView.svg;
            this.path = svgView.path;
            this.trail = svgView.trail;
            this.text = null;
            var newOpts = utils.extend({
                attachment: undefined,
                shape: this
            }, this._opts);
            this._progressPath = new Path(svgView.path, newOpts);
            if (utils.isObject(this._opts.text) && this._opts.text.value !== null) {
                this.setText(this._opts.text.value)
            }
        };
        Shape.prototype.animate = function animate(progress, opts, cb) {
            if (this._progressPath === null) {
                throw new Error(DESTROYED_ERROR)
            }
            this._progressPath.animate(progress, opts, cb)
        };
        Shape.prototype.stop = function stop() {
            if (this._progressPath === null) {
                throw new Error(DESTROYED_ERROR)
            }
            if (this._progressPath === undefined) {
                return
            }
            this._progressPath.stop()
        };
        Shape.prototype.pause = function pause() {
            if (this._progressPath === null) {
                throw new Error(DESTROYED_ERROR)
            }
            if (this._progressPath === undefined) {
                return
            }
            if (!this._progressPath._tweenable) {
                return
            }
            this._progressPath._tweenable.pause()
        };
        Shape.prototype.resume = function resume() {
            if (this._progressPath === null) {
                throw new Error(DESTROYED_ERROR)
            }
            if (this._progressPath === undefined) {
                return
            }
            if (!this._progressPath._tweenable) {
                return
            }
            this._progressPath._tweenable.resume()
        };
        Shape.prototype.destroy = function destroy() {
            if (this._progressPath === null) {
                throw new Error(DESTROYED_ERROR)
            }
            this.stop();
            this.svg.parentNode.removeChild(this.svg);
            this.svg = null;
            this.path = null;
            this.trail = null;
            this._progressPath = null;
            if (this.text !== null) {
                this.text.parentNode.removeChild(this.text);
                this.text = null
            }
        };
        Shape.prototype.set = function set(progress) {
            if (this._progressPath === null) {
                throw new Error(DESTROYED_ERROR)
            }
            this._progressPath.set(progress)
        };
        Shape.prototype.value = function value() {
            if (this._progressPath === null) {
                throw new Error(DESTROYED_ERROR)
            }
            if (this._progressPath === undefined) {
                return 0
            }
            return this._progressPath.value()
        };
        Shape.prototype.setText = function setText(newText) {
            if (this._progressPath === null) {
                throw new Error(DESTROYED_ERROR)
            }
            if (this.text === null) {
                this.text = this._createTextContainer(this._opts, this._container);
                this._container.appendChild(this.text)
            }
            if (utils.isObject(newText)) {
                utils.removeChildren(this.text);
                this.text.appendChild(newText)
            } else {
                this.text.innerHTML = newText
            }
        };
        Shape.prototype._createSvgView = function _createSvgView(opts) {
            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this._initializeSvg(svg, opts);
            var trailPath = null;
            if (opts.trailColor || opts.trailWidth) {
                trailPath = this._createTrail(opts);
                svg.appendChild(trailPath)
            }
            var path = this._createPath(opts);
            svg.appendChild(path);
            return {
                svg: svg,
                path: path,
                trail: trailPath
            }
        };
        Shape.prototype._initializeSvg = function _initializeSvg(svg, opts) {
            svg.setAttribute("viewBox", "0 0 100 100")
        };
        Shape.prototype._createPath = function _createPath(opts) {
            var pathString = this._pathString(opts);
            return this._createPathElement(pathString, opts)
        };
        Shape.prototype._createTrail = function _createTrail(opts) {
            var pathString = this._trailString(opts);
            var newOpts = utils.extend({}, opts);
            if (!newOpts.trailColor) {
                newOpts.trailColor = "#eee"
            }
            if (!newOpts.trailWidth) {
                newOpts.trailWidth = newOpts.strokeWidth
            }
            newOpts.color = newOpts.trailColor;
            newOpts.strokeWidth = newOpts.trailWidth;
            newOpts.fill = null;
            return this._createPathElement(pathString, newOpts)
        };
        Shape.prototype._createPathElement = function _createPathElement(pathString, opts) {
            var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathString);
            path.setAttribute("stroke", opts.color);
            path.setAttribute("stroke-width", opts.strokeWidth);
            if (opts.fill) {
                path.setAttribute("fill", opts.fill)
            } else {
                path.setAttribute("fill-opacity", "0")
            }
            return path
        };
        Shape.prototype._createTextContainer = function _createTextContainer(opts, container) {
            var textContainer = document.createElement("div");
            textContainer.className = opts.text.className;
            var textStyle = opts.text.style;
            if (textStyle) {
                if (opts.text.autoStyleContainer) {
                    container.style.position = "relative"
                }
                utils.setStyles(textContainer, textStyle);
                if (!textStyle.color) {
                    textContainer.style.color = opts.color
                }
            }
            this._initializeTextContainer(opts, container, textContainer);
            return textContainer
        };
        Shape.prototype._initializeTextContainer = function(opts, container, element) {};
        Shape.prototype._pathString = function _pathString(opts) {
            throw new Error("Override this function for each progress bar")
        };
        Shape.prototype._trailString = function _trailString(opts) {
            throw new Error("Override this function for each progress bar")
        };
        Shape.prototype._warnContainerAspectRatio = function _warnContainerAspectRatio(container) {
            if (!this.containerAspectRatio) {
                return
            }
            var computedStyle = window.getComputedStyle(container, null);
            var width = parseFloat(computedStyle.getPropertyValue("width"), 10);
            var height = parseFloat(computedStyle.getPropertyValue("height"), 10);
            if (!utils.floatEquals(this.containerAspectRatio, width / height)) {
                console.warn("Incorrect aspect ratio of container", "#" + container.id, "detected:", computedStyle.getPropertyValue("width") + "(width)", "/", computedStyle.getPropertyValue("height") + "(height)", "=", width / height);
                console.warn("Aspect ratio of should be", this.containerAspectRatio)
            }
        };
        module.exports = Shape
    }, {
        "./path": 4,
        "./utils": 8
    }],
    7: [function(require, module, exports) {
        var Shape = require("./shape");
        var utils = require("./utils");
        var Square = function Square(container, options) {
            this._pathTemplate = "M 0,{halfOfStrokeWidth}" + " L {width},{halfOfStrokeWidth}" + " L {width},{width}" + " L {halfOfStrokeWidth},{width}" + " L {halfOfStrokeWidth},{strokeWidth}";
            this._trailTemplate = "M {startMargin},{halfOfStrokeWidth}" + " L {width},{halfOfStrokeWidth}" + " L {width},{width}" + " L {halfOfStrokeWidth},{width}" + " L {halfOfStrokeWidth},{halfOfStrokeWidth}";
            Shape.apply(this, arguments)
        };
        Square.prototype = new Shape;
        Square.prototype.constructor = Square;
        Square.prototype._pathString = function _pathString(opts) {
            var w = 100 - opts.strokeWidth / 2;
            return utils.render(this._pathTemplate, {
                width: w,
                strokeWidth: opts.strokeWidth,
                halfOfStrokeWidth: opts.strokeWidth / 2
            })
        };
        Square.prototype._trailString = function _trailString(opts) {
            var w = 100 - opts.strokeWidth / 2;
            return utils.render(this._trailTemplate, {
                width: w,
                strokeWidth: opts.strokeWidth,
                halfOfStrokeWidth: opts.strokeWidth / 2,
                startMargin: opts.strokeWidth / 2 - opts.trailWidth / 2
            })
        };
        module.exports = Square
    }, {
        "./shape": 6,
        "./utils": 8
    }],
    8: [function(require, module, exports) {
        var PREFIXES = "Webkit Moz O ms".split(" ");
        var FLOAT_COMPARISON_EPSILON = .001;

        function extend(destination, source, recursive) {
            destination = destination || {};
            source = source || {};
            recursive = recursive || false;
            for (var attrName in source) {
                if (source.hasOwnProperty(attrName)) {
                    var destVal = destination[attrName];
                    var sourceVal = source[attrName];
                    if (recursive && isObject(destVal) && isObject(sourceVal)) {
                        destination[attrName] = extend(destVal, sourceVal, recursive)
                    } else {
                        destination[attrName] = sourceVal
                    }
                }
            }
            return destination
        }

        function render(template, vars) {
            var rendered = template;
            for (var key in vars) {
                if (vars.hasOwnProperty(key)) {
                    var val = vars[key];
                    var regExpString = "\\{" + key + "\\}";
                    var regExp = new RegExp(regExpString, "g");
                    rendered = rendered.replace(regExp, val)
                }
            }
            return rendered
        }

        function setStyle(element, style, value) {
            var elStyle = element.style;
            for (var i = 0; i < PREFIXES.length; ++i) {
                var prefix = PREFIXES[i];
                elStyle[prefix + capitalize(style)] = value
            }
            elStyle[style] = value
        }

        function setStyles(element, styles) {
            forEachObject(styles, function(styleValue, styleName) {
                if (styleValue === null || styleValue === undefined) {
                    return
                }
                if (isObject(styleValue) && styleValue.prefix === true) {
                    setStyle(element, styleName, styleValue.value)
                } else {
                    element.style[styleName] = styleValue
                }
            })
        }

        function capitalize(text) {
            return text.charAt(0).toUpperCase() + text.slice(1)
        }

        function isString(obj) {
            return typeof obj === "string" || obj instanceof String
        }

        function isFunction(obj) {
            return typeof obj === "function"
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]"
        }

        function isObject(obj) {
            if (isArray(obj)) {
                return false
            }
            var type = typeof obj;
            return type === "object" && !!obj
        }

        function forEachObject(object, callback) {
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    var val = object[key];
                    callback(val, key)
                }
            }
        }

        function floatEquals(a, b) {
            return Math.abs(a - b) < FLOAT_COMPARISON_EPSILON
        }

        function removeChildren(el) {
            while (el.firstChild) {
                el.removeChild(el.firstChild)
            }
        }
        module.exports = {
            extend: extend,
            render: render,
            setStyle: setStyle,
            setStyles: setStyles,
            capitalize: capitalize,
            isString: isString,
            isFunction: isFunction,
            isObject: isObject,
            forEachObject: forEachObject,
            floatEquals: floatEquals,
            removeChildren: removeChildren
        }
    }, {}],
    9: [function(require, module, exports) {
        ! function(t, n) {
            "object" == typeof exports && "object" == typeof module ? module.exports = n() : "function" == typeof define && define.amd ? define("shifty", [], n) : "object" == typeof exports ? exports.shifty = n() : t.shifty = n()
        }(self, function() {
            return function() {
                "use strict";
                var t = {
                        720: function(t, n, e) {
                            e.r(n), e.d(n, {
                                Scene: function() {
                                    return Xt
                                },
                                Tweenable: function() {
                                    return _t
                                },
                                interpolate: function() {
                                    return Wt
                                },
                                processTweens: function() {
                                    return ft
                                },
                                setBezierFunction: function() {
                                    return Yt
                                },
                                tween: function() {
                                    return yt
                                },
                                unsetBezierFunction: function() {
                                    return Zt
                                }
                            });
                            var r = {};
                            e.r(r), e.d(r, {
                                bounce: function() {
                                    return D
                                },
                                bouncePast: function() {
                                    return q
                                },
                                easeFrom: function() {
                                    return B
                                },
                                easeFromTo: function() {
                                    return Q
                                },
                                easeInBack: function() {
                                    return T
                                },
                                easeInCirc: function() {
                                    return j
                                },
                                easeInCubic: function() {
                                    return c
                                },
                                easeInExpo: function() {
                                    return w
                                },
                                easeInOutBack: function() {
                                    return F
                                },
                                easeInOutCirc: function() {
                                    return P
                                },
                                easeInOutCubic: function() {
                                    return l
                                },
                                easeInOutExpo: function() {
                                    return S
                                },
                                easeInOutQuad: function() {
                                    return s
                                },
                                easeInOutQuart: function() {
                                    return v
                                },
                                easeInOutQuint: function() {
                                    return d
                                },
                                easeInOutSine: function() {
                                    return b
                                },
                                easeInQuad: function() {
                                    return o
                                },
                                easeInQuart: function() {
                                    return h
                                },
                                easeInQuint: function() {
                                    return _
                                },
                                easeInSine: function() {
                                    return m
                                },
                                easeOutBack: function() {
                                    return E
                                },
                                easeOutBounce: function() {
                                    return M
                                },
                                easeOutCirc: function() {
                                    return k
                                },
                                easeOutCubic: function() {
                                    return f
                                },
                                easeOutExpo: function() {
                                    return O
                                },
                                easeOutQuad: function() {
                                    return a
                                },
                                easeOutQuart: function() {
                                    return p
                                },
                                easeOutQuint: function() {
                                    return y
                                },
                                easeOutSine: function() {
                                    return g
                                },
                                easeTo: function() {
                                    return N
                                },
                                elastic: function() {
                                    return x
                                },
                                linear: function() {
                                    return u
                                },
                                swingFrom: function() {
                                    return I
                                },
                                swingFromTo: function() {
                                    return A
                                },
                                swingTo: function() {
                                    return C
                                }
                            });
                            var i = {};
                            e.r(i), e.d(i, {
                                afterTween: function() {
                                    return Nt
                                },
                                beforeTween: function() {
                                    return Bt
                                },
                                doesApply: function() {
                                    return qt
                                },
                                tweenCreated: function() {
                                    return Qt
                                }
                            });
                            var u = function(t) {
                                    return t
                                },
                                o = function(t) {
                                    return Math.pow(t, 2)
                                },
                                a = function(t) {
                                    return -(Math.pow(t - 1, 2) - 1)
                                },
                                s = function(t) {
                                    return (t /= .5) < 1 ? .5 * Math.pow(t, 2) : -.5 * ((t -= 2) * t - 2)
                                },
                                c = function(t) {
                                    return Math.pow(t, 3)
                                },
                                f = function(t) {
                                    return Math.pow(t - 1, 3) + 1
                                },
                                l = function(t) {
                                    return (t /= .5) < 1 ? .5 * Math.pow(t, 3) : .5 * (Math.pow(t - 2, 3) + 2)
                                },
                                h = function(t) {
                                    return Math.pow(t, 4)
                                },
                                p = function(t) {
                                    return -(Math.pow(t - 1, 4) - 1)
                                },
                                v = function(t) {
                                    return (t /= .5) < 1 ? .5 * Math.pow(t, 4) : -.5 * ((t -= 2) * Math.pow(t, 3) - 2)
                                },
                                _ = function(t) {
                                    return Math.pow(t, 5)
                                },
                                y = function(t) {
                                    return Math.pow(t - 1, 5) + 1
                                },
                                d = function(t) {
                                    return (t /= .5) < 1 ? .5 * Math.pow(t, 5) : .5 * (Math.pow(t - 2, 5) + 2)
                                },
                                m = function(t) {
                                    return 1 - Math.cos(t * (Math.PI / 2))
                                },
                                g = function(t) {
                                    return Math.sin(t * (Math.PI / 2))
                                },
                                b = function(t) {
                                    return -.5 * (Math.cos(Math.PI * t) - 1)
                                },
                                w = function(t) {
                                    return 0 === t ? 0 : Math.pow(2, 10 * (t - 1))
                                },
                                O = function(t) {
                                    return 1 === t ? 1 : 1 - Math.pow(2, -10 * t)
                                },
                                S = function(t) {
                                    return 0 === t ? 0 : 1 === t ? 1 : (t /= .5) < 1 ? .5 * Math.pow(2, 10 * (t - 1)) : .5 * (2 - Math.pow(2, -10 * --t))
                                },
                                j = function(t) {
                                    return -(Math.sqrt(1 - t * t) - 1)
                                },
                                k = function(t) {
                                    return Math.sqrt(1 - Math.pow(t - 1, 2))
                                },
                                P = function(t) {
                                    return (t /= .5) < 1 ? -.5 * (Math.sqrt(1 - t * t) - 1) : .5 * (Math.sqrt(1 - (t -= 2) * t) + 1)
                                },
                                M = function(t) {
                                    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375
                                },
                                T = function(t) {
                                    var n = 1.70158;
                                    return t * t * ((n + 1) * t - n)
                                },
                                E = function(t) {
                                    var n = 1.70158;
                                    return (t -= 1) * t * ((n + 1) * t + n) + 1
                                },
                                F = function(t) {
                                    var n = 1.70158;
                                    return (t /= .5) < 1 ? t * t * ((1 + (n *= 1.525)) * t - n) * .5 : .5 * ((t -= 2) * t * ((1 + (n *= 1.525)) * t + n) + 2)
                                },
                                x = function(t) {
                                    return -1 * Math.pow(4, -8 * t) * Math.sin((6 * t - 1) * (2 * Math.PI) / 2) + 1
                                },
                                A = function(t) {
                                    var n = 1.70158;
                                    return (t /= .5) < 1 ? t * t * ((1 + (n *= 1.525)) * t - n) * .5 : .5 * ((t -= 2) * t * ((1 + (n *= 1.525)) * t + n) + 2)
                                },
                                I = function(t) {
                                    var n = 1.70158;
                                    return t * t * ((n + 1) * t - n)
                                },
                                C = function(t) {
                                    var n = 1.70158;
                                    return (t -= 1) * t * ((n + 1) * t + n) + 1
                                },
                                D = function(t) {
                                    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375
                                },
                                q = function(t) {
                                    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 2 - (7.5625 * (t -= 1.5 / 2.75) * t + .75) : t < 2.5 / 2.75 ? 2 - (7.5625 * (t -= 2.25 / 2.75) * t + .9375) : 2 - (7.5625 * (t -= 2.625 / 2.75) * t + .984375)
                                },
                                Q = function(t) {
                                    return (t /= .5) < 1 ? .5 * Math.pow(t, 4) : -.5 * ((t -= 2) * Math.pow(t, 3) - 2)
                                },
                                B = function(t) {
                                    return Math.pow(t, 4)
                                },
                                N = function(t) {
                                    return Math.pow(t, .25)
                                };

                            function R(t, n) {
                                if (!(t instanceof n)) throw new TypeError("Cannot call a class as a function")
                            }

                            function z(t, n) {
                                for (var e = 0; e < n.length; e++) {
                                    var r = n[e];
                                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(t, r.key, r)
                                }
                            }

                            function L(t) {
                                return (L = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
                                    return typeof t
                                } : function(t) {
                                    return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
                                })(t)
                            }

                            function U(t, n) {
                                var e = Object.keys(t);
                                if (Object.getOwnPropertySymbols) {
                                    var r = Object.getOwnPropertySymbols(t);
                                    n && (r = r.filter(function(n) {
                                        return Object.getOwnPropertyDescriptor(t, n).enumerable
                                    })), e.push.apply(e, r)
                                }
                                return e
                            }

                            function V(t) {
                                for (var n = 1; n < arguments.length; n++) {
                                    var e = null != arguments[n] ? arguments[n] : {};
                                    n % 2 ? U(Object(e), !0).forEach(function(n) {
                                        W(t, n, e[n])
                                    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(e)) : U(Object(e)).forEach(function(n) {
                                        Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(e, n))
                                    })
                                }
                                return t
                            }

                            function W(t, n, e) {
                                return n in t ? Object.defineProperty(t, n, {
                                    value: e,
                                    enumerable: !0,
                                    configurable: !0,
                                    writable: !0
                                }) : t[n] = e, t
                            }
                            var $, G, H, J = "linear",
                                K = "undefined" != typeof window ? window : e.g,
                                X = "afterTween",
                                Y = "afterTweenEnd",
                                Z = "beforeTween",
                                tt = "tweenCreated",
                                nt = "function",
                                et = "string",
                                rt = K.requestAnimationFrame || K.webkitRequestAnimationFrame || K.oRequestAnimationFrame || K.msRequestAnimationFrame || K.mozCancelRequestAnimationFrame && K.mozRequestAnimationFrame || setTimeout,
                                it = function() {},
                                ut = null,
                                ot = null,
                                at = V({}, r),
                                st = function(t, n, e, r, i, u, o) {
                                    var a, s, c, f = t < u ? 0 : (t - u) / i,
                                        l = !1;
                                    for (var h in o && o.call && (l = !0, a = o(f)), n) l || (a = ((s = o[h]).call ? s : at[s])(f)), c = e[h], n[h] = c + (r[h] - c) * a;
                                    return n
                                },
                                ct = function(t, n) {
                                    var e = t._timestamp,
                                        r = t._currentState,
                                        i = t._delay;
                                    if (!(n < e + i)) {
                                        var u = t._duration,
                                            o = t._targetState,
                                            a = e + i + u,
                                            s = n > a ? a : n,
                                            c = s >= a,
                                            f = u - (a - s),
                                            l = t._filters.length > 0;
                                        if (c) return t._render(o, t._data, f), t.stop(!0);
                                        l && t._applyFilter(Z), s < e + i ? e = u = s = 1 : e += i, st(s, r, t._originalState, o, u, e, t._easing), l && t._applyFilter(X), t._render(r, t._data, f)
                                    }
                                },
                                ft = function() {
                                    for (var t, n = _t.now(), e = ut; e;) t = e._next, ct(e, n), e = t
                                },
                                lt = Date.now || function() {
                                    return +new Date
                                },
                                ht = function(t) {
                                    var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : J,
                                        e = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {},
                                        r = L(n);
                                    if (at[n]) return at[n];
                                    if (r === et || r === nt)
                                        for (var i in t) e[i] = n;
                                    else
                                        for (var u in t) e[u] = n[u] || J;
                                    return e
                                },
                                pt = function(t) {
                                    t === ut ? (ut = t._next) ? ut._previous = null : ot = null : t === ot ? (ot = t._previous) ? ot._next = null : ut = null : (G = t._previous, H = t._next, G._next = H, H._previous = G), t._previous = t._next = null
                                },
                                vt = "function" == typeof Promise ? Promise : null,
                                _t = function() {
                                    function t() {
                                        var n = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
                                            e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : void 0;
                                        R(this, t), this._config = {}, this._data = {}, this._delay = 0, this._filters = [], this._next = null, this._previous = null, this._timestamp = null, this._resolve = null, this._reject = null, this._currentState = n || {}, this._originalState = {}, this._targetState = {}, this._start = it, this._render = it, this._promiseCtor = vt, e && this.setConfig(e)
                                    }
                                    var n, e;
                                    return n = t, (e = [{
                                        key: "_applyFilter",
                                        value: function(t) {
                                            for (var n = this._filters.length; n > 0; n--) {
                                                var e = this._filters[n - n][t];
                                                e && e(this)
                                            }
                                        }
                                    }, {
                                        key: "tween",
                                        value: function() {
                                            var n = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : void 0;
                                            return this._isPlaying && this.stop(), !n && this._config || this.setConfig(n), this._pausedAtTime = null, this._timestamp = t.now(), this._start(this.get(), this._data), this._delay && this._render(this._currentState, this._data, 0), this._resume(this._timestamp)
                                        }
                                    }, {
                                        key: "setConfig",
                                        value: function() {
                                            var n = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
                                                e = this._config;
                                            for (var r in n) e[r] = n[r];
                                            var i = e.promise,
                                                u = void 0 === i ? this._promiseCtor : i,
                                                o = e.start,
                                                a = void 0 === o ? it : o,
                                                s = e.finish,
                                                c = e.render,
                                                f = void 0 === c ? this._config.step || it : c,
                                                l = e.step,
                                                h = void 0 === l ? it : l;
                                            this._data = e.data || e.attachment || this._data, this._isPlaying = !1, this._pausedAtTime = null, this._scheduleId = null, this._delay = n.delay || 0, this._start = a, this._render = f || h, this._duration = e.duration || 500, this._promiseCtor = u, s && (this._resolve = s);
                                            var p = n.from,
                                                v = n.to,
                                                _ = void 0 === v ? {} : v,
                                                y = this._currentState,
                                                d = this._originalState,
                                                m = this._targetState;
                                            for (var g in p) y[g] = p[g];
                                            var b = !1;
                                            for (var w in y) {
                                                var O = y[w];
                                                b || L(O) !== et || (b = !0), d[w] = O, m[w] = _.hasOwnProperty(w) ? _[w] : O
                                            }
                                            if (this._easing = ht(this._currentState, e.easing, this._easing), this._filters.length = 0, b) {
                                                for (var S in t.filters) t.filters[S].doesApply(this) && this._filters.push(t.filters[S]);
                                                this._applyFilter(tt)
                                            }
                                            return this
                                        }
                                    }, {
                                        key: "then",
                                        value: function(t, n) {
                                            var e = this;
                                            return this._promise = new this._promiseCtor(function(t, n) {
                                                e._resolve = t, e._reject = n
                                            }), this._promise.then(t, n)
                                        }
                                    }, {
                                        key: "catch",
                                        value: function(t) {
                                            return this.then().catch(t)
                                        }
                                    }, {
                                        key: "get",
                                        value: function() {
                                            return V({}, this._currentState)
                                        }
                                    }, {
                                        key: "set",
                                        value: function(t) {
                                            this._currentState = t
                                        }
                                    }, {
                                        key: "pause",
                                        value: function() {
                                            if (this._isPlaying) return this._pausedAtTime = t.now(), this._isPlaying = !1, pt(this), this
                                        }
                                    }, {
                                        key: "resume",
                                        value: function() {
                                            return this._resume()
                                        }
                                    }, {
                                        key: "_resume",
                                        value: function() {
                                            var n = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : t.now();
                                            return null === this._timestamp ? this.tween() : this._isPlaying ? this._promise : (this._pausedAtTime && (this._timestamp += n - this._pausedAtTime, this._pausedAtTime = null), this._isPlaying = !0, null === ut ? (ut = this, ot = this) : (this._previous = ot, ot._next = this, ot = this), this)
                                        }
                                    }, {
                                        key: "seek",
                                        value: function(n) {
                                            n = Math.max(n, 0);
                                            var e = t.now();
                                            return this._timestamp + n === 0 || (this._timestamp = e - n, ct(this, e)), this
                                        }
                                    }, {
                                        key: "stop",
                                        value: function() {
                                            var t = arguments.length > 0 && void 0 !== arguments[0] && arguments[0];
                                            if (!this._isPlaying) return this;
                                            this._isPlaying = !1, pt(this);
                                            var n = this._filters.length > 0;
                                            t && (n && this._applyFilter(Z), st(1, this._currentState, this._originalState, this._targetState, 1, 0, this._easing), n && (this._applyFilter(X), this._applyFilter(Y))), this._resolve && this._resolve({
                                                data: this._data,
                                                state: this._currentState,
                                                tweenable: this
                                            }), this._resolve = null, this._reject = null;
                                            var e = this._currentState,
                                                r = this._originalState,
                                                i = this._targetState;
                                            for (var u in e) r[u] = i[u] = e[u];
                                            return this
                                        }
                                    }, {
                                        key: "cancel",
                                        value: function() {
                                            var t = arguments.length > 0 && void 0 !== arguments[0] && arguments[0],
                                                n = this._currentState,
                                                e = this._data,
                                                r = this._isPlaying;
                                            return r ? (this._reject && this._reject({
                                                data: e,
                                                state: n,
                                                tweenable: this
                                            }), this._resolve = null, this._reject = null, this.stop(t)) : this
                                        }
                                    }, {
                                        key: "isPlaying",
                                        value: function() {
                                            return this._isPlaying
                                        }
                                    }, {
                                        key: "setScheduleFunction",
                                        value: function(n) {
                                            t.setScheduleFunction(n)
                                        }
                                    }, {
                                        key: "data",
                                        value: function() {
                                            var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : null;
                                            return t && (this._data = V({}, t)), this._data
                                        }
                                    }, {
                                        key: "dispose",
                                        value: function() {
                                            for (var t in this) delete this[t]
                                        }
                                    }]) && z(n.prototype, e), t
                                }();

                            function yt() {
                                var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
                                    n = new _t;
                                return n.tween(t), n.tweenable = n, n
                            }
                            W(_t, "now", function() {
                                    return $
                                }), _t.setScheduleFunction = function(t) {
                                    return rt = t
                                }, _t.formulas = at, _t.filters = {},
                                function t() {
                                    $ = lt(), rt.call(K, t, 16.666666666666668), ft()
                                }();
                            var dt, mt, gt = /(\d|-|\.)/,
                                bt = /([^\-0-9.]+)/g,
                                wt = /[0-9.-]+/g,
                                Ot = (dt = wt.source, mt = /,\s*/.source, new RegExp("rgb\\(".concat(dt).concat(mt).concat(dt).concat(mt).concat(dt, "\\)"), "g")),
                                St = /^.*\(/,
                                jt = /#([0-9]|[a-f]){3,6}/gi,
                                kt = "VAL",
                                Pt = function(t, n) {
                                    return t.map(function(t, e) {
                                        return "_".concat(n, "_").concat(e)
                                    })
                                };

                            function Mt(t) {
                                return parseInt(t, 16)
                            }
                            var Tt = function(t) {
                                    return "rgb(".concat((n = t, 3 === (n = n.replace(/#/, "")).length && (n = (n = n.split(""))[0] + n[0] + n[1] + n[1] + n[2] + n[2]), [Mt(n.substr(0, 2)), Mt(n.substr(2, 2)), Mt(n.substr(4, 2))]).join(","), ")");
                                    var n
                                },
                                Et = function(t, n, e) {
                                    var r = n.match(t),
                                        i = n.replace(t, kt);
                                    return r && r.forEach(function(t) {
                                        return i = i.replace(kt, e(t))
                                    }), i
                                },
                                Ft = function(t) {
                                    for (var n in t) {
                                        var e = t[n];
                                        "string" == typeof e && e.match(jt) && (t[n] = Et(jt, e, Tt))
                                    }
                                },
                                xt = function(t) {
                                    var n = t.match(wt).map(Math.floor),
                                        e = t.match(St)[0];
                                    return "".concat(e).concat(n.join(","), ")")
                                },
                                At = function(t) {
                                    return t.match(wt)
                                },
                                It = function(t, n) {
                                    var e = {};
                                    return n.forEach(function(n) {
                                        e[n] = t[n], delete t[n]
                                    }), e
                                },
                                Ct = function(t, n) {
                                    return n.map(function(n) {
                                        return t[n]
                                    })
                                },
                                Dt = function(t, n) {
                                    return n.forEach(function(n) {
                                        return t = t.replace(kt, +n.toFixed(4))
                                    }), t
                                },
                                qt = function(t) {
                                    for (var n in t._currentState)
                                        if ("string" == typeof t._currentState[n]) return !0;
                                    return !1
                                };

                            function Qt(t) {
                                var n = t._currentState;
                                [n, t._originalState, t._targetState].forEach(Ft), t._tokenData = function(t) {
                                    var n, e, r = {};
                                    for (var i in t) {
                                        var u = t[i];
                                        "string" == typeof u && (r[i] = {
                                            formatString: (n = u, e = void 0, e = n.match(bt), e ? (1 === e.length || n.charAt(0).match(gt)) && e.unshift("") : e = ["", ""], e.join(kt)),
                                            chunkNames: Pt(At(u), i)
                                        })
                                    }
                                    return r
                                }(n)
                            }

                            function Bt(t) {
                                var n = t._currentState,
                                    e = t._originalState,
                                    r = t._targetState,
                                    i = t._easing,
                                    u = t._tokenData;
                                ! function(t, n) {
                                    var e = function(e) {
                                        var r = n[e].chunkNames,
                                            i = t[e];
                                        if ("string" == typeof i) {
                                            var u = i.split(" "),
                                                o = u[u.length - 1];
                                            r.forEach(function(n, e) {
                                                return t[n] = u[e] || o
                                            })
                                        } else r.forEach(function(n) {
                                            return t[n] = i
                                        });
                                        delete t[e]
                                    };
                                    for (var r in n) e(r)
                                }(i, u), [n, e, r].forEach(function(t) {
                                    return function(t, n) {
                                        var e = function(e) {
                                            At(t[e]).forEach(function(r, i) {
                                                return t[n[e].chunkNames[i]] = +r
                                            }), delete t[e]
                                        };
                                        for (var r in n) e(r)
                                    }(t, u)
                                })
                            }

                            function Nt(t) {
                                var n = t._currentState,
                                    e = t._originalState,
                                    r = t._targetState,
                                    i = t._easing,
                                    u = t._tokenData;
                                [n, e, r].forEach(function(t) {
                                        return function(t, n) {
                                            for (var e in n) {
                                                var r = n[e],
                                                    i = r.chunkNames,
                                                    u = r.formatString,
                                                    o = Dt(u, Ct(It(t, i), i));
                                                t[e] = Et(Ot, o, xt)
                                            }
                                        }(t, u)
                                    }),
                                    function(t, n) {
                                        for (var e in n) {
                                            var r = n[e].chunkNames,
                                                i = t[r[0]];
                                            t[e] = "string" == typeof i ? r.map(function(n) {
                                                var e = t[n];
                                                return delete t[n], e
                                            }).join(" ") : i
                                        }
                                    }(i, u)
                            }

                            function Rt(t, n) {
                                var e = Object.keys(t);
                                if (Object.getOwnPropertySymbols) {
                                    var r = Object.getOwnPropertySymbols(t);
                                    n && (r = r.filter(function(n) {
                                        return Object.getOwnPropertyDescriptor(t, n).enumerable
                                    })), e.push.apply(e, r)
                                }
                                return e
                            }

                            function zt(t) {
                                for (var n = 1; n < arguments.length; n++) {
                                    var e = null != arguments[n] ? arguments[n] : {};
                                    n % 2 ? Rt(Object(e), !0).forEach(function(n) {
                                        Lt(t, n, e[n])
                                    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(e)) : Rt(Object(e)).forEach(function(n) {
                                        Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(e, n))
                                    })
                                }
                                return t
                            }

                            function Lt(t, n, e) {
                                return n in t ? Object.defineProperty(t, n, {
                                    value: e,
                                    enumerable: !0,
                                    configurable: !0,
                                    writable: !0
                                }) : t[n] = e, t
                            }
                            var Ut = new _t,
                                Vt = _t.filters,
                                Wt = function(t, n, e, r) {
                                    var i = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : 0,
                                        u = zt({}, t),
                                        o = ht(t, r);
                                    for (var a in Ut._filters.length = 0, Ut.set({}), Ut._currentState = u, Ut._originalState = t, Ut._targetState = n, Ut._easing = o, Vt) Vt[a].doesApply(Ut) && Ut._filters.push(Vt[a]);
                                    Ut._applyFilter("tweenCreated"), Ut._applyFilter("beforeTween");
                                    var s = st(e, u, t, n, 1, i, o);
                                    return Ut._applyFilter("afterTween"), s
                                };

                            function $t(t, n) {
                                (null == n || n > t.length) && (n = t.length);
                                for (var e = 0, r = new Array(n); e < n; e++) r[e] = t[e];
                                return r
                            }

                            function Gt(t, n) {
                                if (!(t instanceof n)) throw new TypeError("Cannot call a class as a function")
                            }

                            function Ht(t, n) {
                                for (var e = 0; e < n.length; e++) {
                                    var r = n[e];
                                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(t, r.key, r)
                                }
                            }

                            function Jt(t, n) {
                                var e = n.get(t);
                                if (!e) throw new TypeError("attempted to get private field on non-instance");
                                return e.get ? e.get.call(t) : e.value
                            }
                            var Kt = new WeakMap,
                                Xt = function() {
                                    function t() {
                                        Gt(this, t), Kt.set(this, {
                                            writable: !0,
                                            value: []
                                        });
                                        for (var n = arguments.length, e = new Array(n), r = 0; r < n; r++) e[r] = arguments[r];
                                        e.forEach(this.add.bind(this))
                                    }
                                    var n, e;
                                    return n = t, (e = [{
                                        key: "add",
                                        value: function(t) {
                                            return Jt(this, Kt).push(t), t
                                        }
                                    }, {
                                        key: "remove",
                                        value: function(t) {
                                            var n = Jt(this, Kt).indexOf(t);
                                            return ~n && Jt(this, Kt).splice(n, 1), t
                                        }
                                    }, {
                                        key: "empty",
                                        value: function() {
                                            return this.tweenables.map(this.remove.bind(this))
                                        }
                                    }, {
                                        key: "isPlaying",
                                        value: function() {
                                            return Jt(this, Kt).some(function(t) {
                                                return t.isPlaying()
                                            })
                                        }
                                    }, {
                                        key: "play",
                                        value: function() {
                                            return Jt(this, Kt).forEach(function(t) {
                                                return t.tween()
                                            }), this
                                        }
                                    }, {
                                        key: "pause",
                                        value: function() {
                                            return Jt(this, Kt).forEach(function(t) {
                                                return t.pause()
                                            }), this
                                        }
                                    }, {
                                        key: "resume",
                                        value: function() {
                                            return Jt(this, Kt).forEach(function(t) {
                                                return t.resume()
                                            }), this
                                        }
                                    }, {
                                        key: "stop",
                                        value: function(t) {
                                            return Jt(this, Kt).forEach(function(n) {
                                                return n.stop(t)
                                            }), this
                                        }
                                    }, {
                                        key: "tweenables",
                                        get: function() {
                                            return function(t) {
                                                if (Array.isArray(t)) return $t(t)
                                            }(t = Jt(this, Kt)) || function(t) {
                                                if ("undefined" != typeof Symbol && Symbol.iterator in Object(t)) return Array.from(t)
                                            }(t) || function(t, n) {
                                                if (t) {
                                                    if ("string" == typeof t) return $t(t, n);
                                                    var e = Object.prototype.toString.call(t).slice(8, -1);
                                                    return "Object" === e && t.constructor && (e = t.constructor.name), "Map" === e || "Set" === e ? Array.from(t) : "Arguments" === e || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e) ? $t(t, n) : void 0
                                                }
                                            }(t) || function() {
                                                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
                                            }();
                                            var t
                                        }
                                    }, {
                                        key: "promises",
                                        get: function() {
                                            return Jt(this, Kt).map(function(t) {
                                                return t.then()
                                            })
                                        }
                                    }]) && Ht(n.prototype, e), t
                                }();
                            var Yt = function(t, n, e, r, i) {
                                    var u = function(t, n, e, r) {
                                        return function(i) {
                                            return f = 0, l = 0, h = 0, p = function(t) {
                                                    return ((f * t + l) * t + h) * t
                                                }, v = function(t) {
                                                    return (3 * f * t + 2 * l) * t + h
                                                }, _ = function(t) {
                                                    return t >= 0 ? t : 0 - t
                                                }, f = 1 - (h = 3 * (u = t)) - (l = 3 * (e - u) - h), a = 1 - (c = 3 * (o = n)) - (s = 3 * (r - o) - c),
                                                function(t) {
                                                    return ((a * t + s) * t + c) * t
                                                }(function(t, n) {
                                                    var e, r, i, u, o, a;
                                                    for (i = t, a = 0; a < 8; a++) {
                                                        if (u = p(i) - t, _(u) < n) return i;
                                                        if (o = v(i), _(o) < 1e-6) break;
                                                        i -= u / o
                                                    }
                                                    if ((i = t) < (e = 0)) return e;
                                                    if (i > (r = 1)) return r;
                                                    for (; e < r;) {
                                                        if (u = p(i), _(u - t) < n) return i;
                                                        t > u ? e = i : r = i, i = .5 * (r - e) + e
                                                    }
                                                    return i
                                                }(i, function(t) {
                                                    return 1 / (200 * t)
                                                }(1)));
                                            var u, o, a, s, c, f, l, h, p, v, _
                                        }
                                    }(n, e, r, i);
                                    return u.displayName = t, u.x1 = n, u.y1 = e, u.x2 = r, u.y2 = i, _t.formulas[t] = u
                                },
                                Zt = function(t) {
                                    return delete _t.formulas[t]
                                };
                            _t.filters.token = i
                        }
                    },
                    n = {};

                function e(r) {
                    if (n[r]) return n[r].exports;
                    var i = n[r] = {
                        exports: {}
                    };
                    return t[r](i, i.exports, e), i.exports
                }
                return e.d = function(t, n) {
                    for (var r in n) e.o(n, r) && !e.o(t, r) && Object.defineProperty(t, r, {
                        enumerable: !0,
                        get: n[r]
                    })
                }, e.g = function() {
                    if ("object" == typeof globalThis) return globalThis;
                    try {
                        return this || new Function("return this")()
                    } catch (t) {
                        if ("object" == typeof window) return window
                    }
                }(), e.o = function(t, n) {
                    return Object.prototype.hasOwnProperty.call(t, n)
                }, e.r = function(t) {
                    "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, {
                        value: "Module"
                    }), Object.defineProperty(t, "__esModule", {
                        value: !0
                    })
                }, e(720)
            }()
        })
    }, {}],
    10: [function(require, module, exports) {
        let MobileCheck = function() {
            var check = false;
            (function(a) {
                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true
            })(navigator.userAgent || navigator.vendor || window.opera);
            return check
        };
        module.exports = {
            MobileCheck: MobileCheck
        }
    }, {}],
    11: [function(require, module, exports) {
        let agents = require("./agents");
        var ProgressBar = require("progressbar.js");

        function bindEvent(element, eventName, eventHandler) {
            if (element.addEventListener) {
                element.addEventListener(eventName, eventHandler, false)
            } else if (element.attachEvent) {
                element.attachEvent("on" + eventName, eventHandler)
            }
        }
        const VERSION = "4";
        const IFRAME_ID = "INTASEND-WEBSDK-POPUP-IFRAME-" + VERSION;
        const MODAL_ELEMENT_ID = "INTASEND-WEBSDK-MODAL-" + VERSION;
        var IntaSend = function(obj) {
            let self = this;
            obj = obj || {};
            this._btnElement = Object;
            this._dataset = Object;
            this._checkoutID = "";
            this._signature = "";
            this.version = VERSION;
            this._publicAPIKey = obj.publicAPIKey;
            this._redirectURL = obj.redirectURL;
            this._live = obj.live || false;
            this._element = obj.element || "intaSendPayButton";
            this.mode = obj.mode || "popup";
            this.inlineContainer = obj.inlineContainer || "checkoutElement";
            this._layout = obj.layout || "tabs";
            this._methods = obj.methods || ["card", "mpesa"];
            this._styles = obj.styles || {
                componentBackgroundColor: "#F7FAFC",
                unselectedCardBackgroundColor: "#FFFFFF",
                selectedCardBackgroundColor: "#FFFFFF",
                selectedBorderColor: "2px solid #056BD5",
                unselectedBorderColor: "2px solid #A0AEC0",
                selectedFontColor: "#056BD5",
                unselectedFontColor: "#333333",
                selectedCardShadow: "0px 0px 7px rgba(5, 107, 213, 0.5)",
                unselectedCardShadow: "none",
                borderRadius: "10px",
                inputLabelColor: "#000000",
                inputTextColor: "#000",
                inputBackgroundColor: "#FFFFFF",
                inputBorderColor: "#CCCCCC",
                inputBorderRadius: "10px",
                ctaBgColor: "#056BD5",
                ctaFontColor: "#fff",
                fontFamily: "",
                fontWeight: "light"
            };
            this.is_mobile = agents.MobileCheck();
            this.is_ios = (/iPad|iPhone|iPod/.test(navigator.platform) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) && !window.MSStream;
            this._showProcessing = function() {
                let isLoadIdt = document.createElement("isLoadIdt");
                isLoadIdt.id = "isLoadIdt";
                isLoadIdt.style.top = 0;
                isLoadIdt.style.left = 0;
                isLoadIdt.style.position = "fixed";
                document.body.appendChild(isLoadIdt);
                var line = new ProgressBar.Line("#isLoadIdt", {
                    color: "#666",
                    easing: "easeInOut",
                    strokeWidth: 1
                });
                line.animate(1)
            };
            this._hideProcessing = function() {
                let isLoadIdts = document.querySelectorAll("isLoadIdt");
                for (let x = 0; x < isLoadIdts.length; x++) {
                    isLoadIdts[x].parentNode.removeChild(isLoadIdts[x])
                }
            };
            this._createCheckoutRequest = function(payload) {
                let self = this;
                payload.callback_url = this._redirectURL;
                payload.public_key = this._publicAPIKey;
                payload.host = window.location.protocol + "//" + window.location.host;
                payload.is_mobile = this.is_mobile;
                payload.is_ios = this.is_ios;
                payload.version = this.version;
                payload.mode = this.mode;
                this._showProcessing();
                var requestURL = "https://sandbox.intasend.com/api/v1/checkout/";
                if (this._live) {
                    requestURL = "https://payment.intasend.com/api/v1/checkout/"
                }
                let myRequest = new Request(requestURL, {
                    method: "POST",
                    body: JSON.stringify(payload),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });
                fetch(myRequest).then(response => response.json()).then(response => {
                    self._checkoutID = response.id;
                    self._signature = response.signature;
                    self._layout = response.layout ? response.layout : self._layout;
                    self._methods = response.methods ? response.methods : self._methods;
                    self._styles = response.styles ? response.styles : self._styles;
                    if (self._checkoutID && self._signature) {
                        self._loadPaymentModal()
                    } else {
                        self._hideProcessing()
                    }
                }).catch(err => {
                    alert("We experienced a problem while initiating your request. Please consider starting the payment process again. If this issue persist, please contact us at support@intasend.com");
                    self._hideProcessing()
                })
            };
            this._clearElements = function() {
                let iframe = document.getElementById(IFRAME_ID);
                if (iframe) {
                    iframe.parentNode.removeChild(iframe)
                }
                let modal = document.getElementById(MODAL_ELEMENT_ID);
                if (modal) {
                    modal.parentNode.removeChild(modal)
                }
            };
            this._btnElement = document.getElementsByClassName(this._element);
            if (this._btnElement) {
                for (let i = 0; i < this._btnElement.length; ++i) {
                    let btn = this._btnElement[i];
                    btn.addEventListener("click", function() {
                        let dataset = btn.dataset;
                        self._createCheckoutRequest(dataset)
                    })
                }
            }
            this._loadPaymentModal = function() {
                try {
                    if (this._checkoutID && this._signature) {
                        if (this.mode === "popup") {
                            this._clearElements();
                            let modalContent = this._prepareModal();
                            if (!this.is_mobile) {
                                this._closeModalIcon(modalContent)
                            }
                            let iframe = this._prepareFrame(modalContent, this._checkoutID, this._signature, this._layout, this._methods, this._styles);
                            return iframe
                        } else if (this.mode === "inline") {
                            var containerElem = document.getElementById(this.inlineContainer);
                            let iframe = this._prepareFrame(containerElem, this._checkoutID, this._signature, this._layout, this._methods, this._styles);
                            return iframe
                        }
                    }
                } catch (err) {
                    this._hideProcessing()
                }
            };
            this._prepareModal = function() {
                let modal = document.createElement("modal");
                modal.setAttribute("id", MODAL_ELEMENT_ID);
                if (this.mode === "popup") {
                    modal.style.display = "flex";
                    modal.style.position = "fixed";
                    modal.style.zIndex = 1200;
                    modal.style.left = 0;
                    modal.style.top = 0;
                    modal.style.width = "100%";
                    modal.style.height = "100%";
                    modal.style.overflow = "auto";
                    modal.style.backgroundColor = "rgb(0,0,0)";
                    modal.style.backgroundColor = "rgba(0,0,0,0.7)"
                }
                document.body.appendChild(modal);
                let modalContent = document.createElement("modal-content");
                if (this.is_mobile) {
                    modalContent.style.width = "100%"
                } else {
                    if (this.mode === "popup") {
                        modalContent.style.width = "380px"
                    }
                }
                modalContent.style.height = "100%";
                modalContent.style.margin = "auto";
                modalContent.style.display = "block";
                if (!this.is_mobile) {
                    modalContent.style.paddingTop = "20px";
                    modalContent.style.backgroundColor = "transparent"
                } else {
                    modalContent.style.paddingTop = "0px";
                    modalContent.style.backgroundColor = "#ffffff"
                }
                modal.appendChild(modalContent);
                return modalContent
            };
            this.onClose = function() {
                let self = this;
                if (this.mode === "popup") {
                    bindEvent(window, "message", function(e) {
                        if (e.origin === "https://websdk-sandbox-v2.intasend.com" || e.origin === "https://websdk-v2.intasend.com") {
                            if (e.data.message) {
                                if (e.data.message.identitier == "intasend-close-modal-cdrtl") {
                                    self.exitPay()
                                }
                            }
                        }
                    })
                }
            };
            this._closeModalIcon = function(modalContent) {
                let self = this;
                let iconHolder = document.createElement("div");
                let icon = document.createElement("div");
                icon.innerHTML = this._closeIconSVG();
                icon.style.cursor = "pointer";
                icon.style.right = "-32px";
                icon.style.bottom = "-32px";
                icon.style.position = "absolute";
                iconHolder.style.position = "relative";
                iconHolder.style.display = "block";
                iconHolder.style.height = "10px";
                iconHolder.style.zIndex = 1250;
                iconHolder.appendChild(icon);
                modalContent.appendChild(iconHolder);
                icon.addEventListener("click", function() {
                    self._clearElements()
                })
            };
            this._openInNewTab = function(url) {
                try {
                    var newWindow = window.open(url, "_blank");
                    if (newWindow) {
                        newWindow.focus()
                    } else {
                        window.location.href = url
                    }
                } catch (err) {
                    window.location.href = url
                }
            };
            this._prepareFrame = function(parentContainer, checkoutID, signature, layout, methods, styles) {
                let data = {
                    checkout_id: checkoutID,
                    signature: signature,
                    layout: layout,
                    methods: methods,
                    styles: styles
                };
                let encoded = btoa(JSON.stringify(data));
                let payload = {
                    checkout: encoded,
                    is_mobile: this.is_mobile,
                    is_ios: this.is_ios
                };
                let params = new URLSearchParams(payload).toString();
                let ifrm = document.createElement("iframe");
                if (this.is_ios) {
                    let websdk_url = "https://websdk-v2.intasend.com/?" + params;
                    this._openInNewTab(websdk_url);
                    return
                }
                if (this._live) {
                    ifrm.setAttribute("src", "https://websdk-v2.intasend.com/?" + params)
                } else {
                    ifrm.setAttribute("src", "https://websdk-sandbox-v2.intasend.com/?" + params)
                }
                ifrm.setAttribute("id", IFRAME_ID);
                ifrm.setAttribute("allow", "payment; clipboard-read; clipboard-write;");
                ifrm.setAttribute("sandbox", "allow-scripts allow-popups allow-same-origin allow-forms");
                ifrm.style.width = "100%";
                if (!this.is_mobile) {
                    ifrm.style.height = "100%"
                } else {
                    ifrm.style.height = "100vh"
                }
                ifrm.style.border = 0;
                ifrm.frameborder = 0;
                ifrm.style.borderRadius = "0.25rem";
                ifrm.scrolling = "no";
                ifrm.onload = function() {
                    self._hideProcessing()
                };
                parentContainer.appendChild(ifrm);
                return ifrm
            };
            this._eventListener = function(eventName, callback) {
                bindEvent(window, "message", function(e) {
                    if (e.origin === "https://websdk-sandbox-v2.intasend.com" || e.origin === "https://websdk-v2.intasend.com") {
                        if (e.data.message) {
                            if (e.data.message.identitier == "intasend-status-update-cdrtl") {
                                if (e.data.message.state === eventName) {
                                    callback(e.data.message)
                                }
                            }
                        }
                    }
                });
                return this
            };
            this._closeIconSVG = function() {
                return `<svg xmlns="https://www.w3.org/2000/svg" xmlns:xlink="https://www.w3.org/1999/xlink" width="54" height="54" viewBox="0 0 60 60">
        <defs>
          <filter id="Ellipse_11" x="0" y="0" width="60" height="60" filterUnits="userSpaceOnUse">
            <feOffset dy="3" input="SourceAlpha"/>
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feFlood flood-color="#6b6b6b" flood-opacity="0.157"/>
            <feComposite operator="in" in2="blur"/>
            <feComposite in="SourceGraphic"/>
          </filter>
        </defs>
        <g id="Group_142" data-name="Group 142" transform="translate(-1178 -327)">
          <g transform="matrix(1, 0, 0, 1, 1178, 327)" filter="url(#Ellipse_11)">
            <circle id="Ellipse_11-2" data-name="Ellipse 11" cx="21" cy="21" r="21" transform="translate(9 6)" fill="#fff"/>
          </g>
          <g id="x-circle" transform="translate(1196 342)">
            <circle id="Ellipse_12" data-name="Ellipse 12" cx="10" cy="10" r="10" transform="translate(2 2)" fill="none" stroke="#414141" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            <line id="Line_3" data-name="Line 3" x1="6" y2="6" transform="translate(9 9)" fill="none" stroke="#414141" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            <line id="Line_4" data-name="Line 4" x2="6" y2="6" transform="translate(9 9)" fill="none" stroke="#414141" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
          </g>
        </g>
      </svg>`
            };
            this.onClose();
            this.on = this._eventListener;
            if (self._redirectURL) {
                this.on("COMPLETE", () => {
                    window.location.href = self._redirectURL
                })
            }
            this.exitPay = function() {
                this._clearElements()
            };
            this.run = function(obj) {
                this._createCheckoutRequest(obj);
                return this
            };
            this.continue = function(payload) {
                this._checkoutID = payload.checkoutID;
                this._signature = payload.signature;
                this._live = payload.live || false;
                this._showProcessing();
                this._loadPaymentModal();
                return this
            };
            return this
        };
        window.IntaSend = IntaSend;
        module.exports = IntaSend
    }, {
        "./agents": 10,
        "progressbar.js": 3
    }]
}, {}, [11]);