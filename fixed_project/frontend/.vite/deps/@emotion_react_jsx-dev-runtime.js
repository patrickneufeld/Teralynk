import {
  Emotion$1,
  createEmotionProps,
  hasOwnProperty,
  require_hoist_non_react_statics_cjs
} from "./chunk-ACWNJTZF.js";
import "./chunk-DSUTBUCJ.js";
import {
  require_react
} from "./chunk-UPB6Y4P2.js";
import {
  __commonJS,
  __toESM
} from "./chunk-3EJPJMEH.js";

// node_modules/react/cjs/react-jsx-dev-runtime.development.js
var require_react_jsx_dev_runtime_development = __commonJS({
  "node_modules/react/cjs/react-jsx-dev-runtime.development.js"(exports) {
    "use strict";
    if (process.env.NODE_ENV !== "production") {
      (function() {
        "use strict";
        var React = require_react();
        var REACT_ELEMENT_TYPE = Symbol.for("react.element");
        var REACT_PORTAL_TYPE = Symbol.for("react.portal");
        var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
        var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
        var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
        var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
        var REACT_CONTEXT_TYPE = Symbol.for("react.context");
        var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
        var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
        var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
        var REACT_MEMO_TYPE = Symbol.for("react.memo");
        var REACT_LAZY_TYPE = Symbol.for("react.lazy");
        var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
        var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
        var FAUX_ITERATOR_SYMBOL = "@@iterator";
        
        function getIteratorFn(maybeIterable) {
          if (maybeIterable === null || typeof maybeIterable !== "object") {
            return null;
          }
          var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
          if (typeof maybeIterator === "function") {
            return maybeIterator;
          }
          return null;
        }
        
        var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        
        function error(format) {
          if (process.env.NODE_ENV !== "production") {
            for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
              args[_key2 - 1] = arguments[_key2];
            }
            printWarning("error", format, args);
          }
        }
        
        function printWarning(level, format, args) {
          if (process.env.NODE_ENV !== "production") {
            var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
            var stack = ReactDebugCurrentFrame2.getStackAddendum();
            if (stack !== "") {
              format += "%s";
              args = args.concat([stack]);
            }
            var argsWithFormat = args.map(function(item) {
              return String(item);
            });
            argsWithFormat.unshift("Warning: " + format);
            Function.prototype.apply.call(console[level], console, argsWithFormat);
          }
        }
      })();
    }
  }
});var enableScopeAPI = false;
var enableCacheElement = false;
var enableTransitionTracing = false;
var enableLegacyHidden = false;
var enableDebugTracing = false;
var REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");

function isValidElementType(type) {
  if (typeof type === "string" || typeof type === "function") {
    return true;
  }
  if (
    type === REACT_FRAGMENT_TYPE ||
    type === REACT_PROFILER_TYPE ||
    enableDebugTracing ||
    type === REACT_STRICT_MODE_TYPE ||
    type === REACT_SUSPENSE_TYPE ||
    type === REACT_SUSPENSE_LIST_TYPE ||
    enableLegacyHidden ||
    type === REACT_OFFSCREEN_TYPE ||
    enableScopeAPI ||
    enableCacheElement ||
    enableTransitionTracing
  ) {
    return true;
  }
  if (typeof type === "object" && type !== null) {
    if (
      type.$$typeof === REACT_LAZY_TYPE ||
      type.$$typeof === REACT_MEMO_TYPE ||
      type.$$typeof === REACT_PROVIDER_TYPE ||
      type.$$typeof === REACT_CONTEXT_TYPE ||
      type.$$typeof === REACT_FORWARD_REF_TYPE ||
      type.$$typeof === REACT_MODULE_REFERENCE ||
      type.getModuleId !== void 0
    ) {
      return true;
    }
  }
  return false;
}

function getWrappedName(outerType, innerType, wrapperName) {
  var displayName = outerType.displayName;
  if (displayName) {
    return displayName;
  }
  var functionName = innerType.displayName || innerType.name || "";
  return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
}

function getContextName(type) {
  return type.displayName || "Context";
}

function getComponentNameFromType(type) {
  if (type == null) {
    return null;
  }
  if (typeof type.tag === "number") {
    console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
  }
  if (typeof type === "function") {
    return type.displayName || type.name || null;
  }
  if (typeof type === "string") {
    return type;
  }
  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return "Fragment";
    case REACT_PORTAL_TYPE:
      return "Portal";
    case REACT_PROFILER_TYPE:
      return "Profiler";
    case REACT_STRICT_MODE_TYPE:
      return "StrictMode";
    case REACT_SUSPENSE_TYPE:
      return "Suspense";
    case REACT_SUSPENSE_LIST_TYPE:
      return "SuspenseList";
    default:
      return null;
  }
}          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_CONTEXT_TYPE:
                var context = type;
                return getContextName(context) + ".Consumer";
              case REACT_PROVIDER_TYPE:
                var provider = type;
                return getContextName(provider._context) + ".Provider";
              case REACT_FORWARD_REF_TYPE:
                return getWrappedName(type, type.render, "ForwardRef");
              case REACT_MEMO_TYPE:
                var outerName = type.displayName || null;
                if (outerName !== null) {
                  return outerName;
                }
                return getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return getComponentNameFromType(init(payload));
                } catch (x) {
                  return null;
                }
              }
              default:
                return null;
            }
          }
          return null;
        }
        
        var assign = Object.assign;
        var disabledDepth = 0;
        var prevLog;
        var prevInfo;
        var prevWarn;
        var prevError;
        var prevGroup;
        var prevGroupCollapsed;
        var prevGroupEnd;

        function disabledLog() {}

        disabledLog.__reactDisabledLog = true;

        function disableLogs() {
          if (disabledDepth === 0) {
            prevLog = console.log;
            prevInfo = console.info;
            prevWarn = console.warn;
            prevError = console.error;
            prevGroup = console.group;
            prevGroupCollapsed = console.groupCollapsed;
            prevGroupEnd = console.groupEnd;
            var props = {
              configurable: true,
              enumerable: true,
              value: disabledLog,
              writable: true
            };
            Object.defineProperties(console, {
              info: props,
              log: props,
              warn: props,
              error: props,
              group: props,
              groupCollapsed: props,
              groupEnd: props
            });
          }
          disabledDepth++;
        }

        function reenableLogs() {
          disabledDepth--;
          if (disabledDepth === 0) {
            var props = {
              configurable: true,
              enumerable: true,
              writable: true
            };
            Object.defineProperties(console, {
              log: assign({}, props, {
                value: prevLog
              }),
              info: assign({}, props, {
                value: prevInfo
              }),
              warn: assign({}, props, {
                value: prevWarn
              }),
              error: assign({}, props, {
                value: prevError
              }),
              group: assign({}, props, {
                value: prevGroup
              }),
              groupCollapsed: assign({}, props, {
                value: prevGroupCollapsed
              }),
              groupEnd: assign({}, props, {
                value: prevGroupEnd
              })
            });
          }
        }            }),
            error: assign({}, props, {
              value: prevError
            }),
            group: assign({}, props, {
              value: prevGroup
            }),
            groupCollapsed: assign({}, props, {
              value: prevGroupCollapsed
            }),
            groupEnd: assign({}, props, {
              value: prevGroupEnd
            })
          });
        }
        if (disabledDepth < 0) {
          console.error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
        }
      }
    }
    var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
    var prefix;
    function describeBuiltInComponentFrame(name, source, ownerFn) {
      if (prefix === undefined) {
        try {
          throw new Error();
        } catch (x) {
          var match = x.stack.trim().match(/\n( *(at )?)/);
          prefix = match && match[1] || "";
        }
      }
      return "\n" + prefix + name;
    }
    var reentry = false;
    var componentFrameCache;
    {
      var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
      componentFrameCache = new PossiblyWeakMap();
    }
    function describeNativeComponentFrame(fn, construct) {
      if (!fn || reentry) {
        return "";
      }
      var frame = componentFrameCache.get(fn);
      if (frame !== undefined) {
        return frame;
      }
      var control;
      reentry = true;
      var previousPrepareStackTrace = Error.prepareStackTrace;
      Error.prepareStackTrace = undefined;
      var previousDispatcher;
      {
        previousDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = null;
        disableLogs();
      }
      try {
        if (construct) {
          var Fake = function() {
            throw new Error();
          };
          Object.defineProperty(Fake.prototype, "props", {
            set: function() {
              throw new Error();
            }
          });
          if (typeof Reflect === "object" && Reflect.construct) {
            try {
              Reflect.construct(Fake, []);
            } catch (x) {
              control = x;
            }
            Reflect.construct(fn, [], Fake);
          } else {
            try {
              Fake.call();
            } catch (x) {
              control = x;
            }
            fn.call(Fake.prototype);
          }
        } else {
          try {
            throw new Error();
          } catch (x) {
            control = x;
          }
          fn();
        }
      } catch (sample) {
        // Handle the sample error here if needed
      } finally {
        reentry = false;
        Error.prepareStackTrace = previousPrepareStackTrace;
        ReactCurrentDispatcher.current = previousDispatcher;
        reenableLogs();
      }
      var stack = control && control.stack;
      frame = stack != null ? describeBuiltInComponentFrame(fn.name, null, null) : "";
      componentFrameCache.set(fn, frame);
      return frame;
    }if (sample && control && typeof sample.stack === "string" && typeof control.stack === "string") {
  var sampleLines = sample.stack.split("\n");
  var controlLines = control.stack.split("\n");
  var s = sampleLines.length - 1;
  var c = controlLines.length - 1;
  while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
    c--;
  }
  for (; s >= 1 && c >= 0; s--, c--) {
    if (sampleLines[s] !== controlLines[c]) {
      if (s !== 1 || c !== 1) {
        do {
          s--;
          c--;
          if (c < 0 || sampleLines[s] !== controlLines[c]) {
            var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
            if (fn && fn.displayName && _frame.includes("<anonymous>")) {
              _frame = _frame.replace("<anonymous>", fn.displayName);
            }
            if (typeof fn === "function") {
              componentFrameCache.set(fn, _frame);
            }
            return _frame;
          }
        } while (s >= 1 && c >= 0);
      }
      break;
    }
  }
}

finally {
  reentry = false;
  ReactCurrentDispatcher.current = previousDispatcher;
  reenableLogs();
  Error.prepareStackTrace = previousPrepareStackTrace;
}

var name = fn ? fn.displayName || fn.name : "";
var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
if (typeof fn === "function") {
  componentFrameCache.set(fn, syntheticFrame);
}
return syntheticFrame;

function describeFunctionComponentFrame(fn, source, ownerFn) {
  return describeNativeComponentFrame(fn, false);
}

function shouldConstruct(Component) {
  var prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
  if (type == null) {
    return "";
  }
  if (typeof type === "function") {
    return describeNativeComponentFrame(type, shouldConstruct(type));
  }
  if (typeof type === "string") {
    return describeBuiltInComponentFrame(type);
  }
  switch (type) {
    case REACT_SUSPENSE_TYPE:
      return describeBuiltInComponentFrame("Suspense");
    case REACT_SUSPENSE_LIST_TYPE:
      return describeBuiltInComponentFrame("SuspenseList");
  }
  if (typeof type === "object") {
    // Additional handling for object types can be added here
  }
}switch (type.$$typeof) {
  case REACT_FORWARD_REF_TYPE:
    return describeFunctionComponentFrame(type.render);
  case REACT_MEMO_TYPE:
    return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
  case REACT_LAZY_TYPE: {
    var lazyComponent = type;
    var payload = lazyComponent._payload;
    var init = lazyComponent._init;
    try {
      return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
    } catch (x) {
      // Log the error for debugging purposes
      console.error("Error initializing lazy component:", x);
    }
  }
}
return "";

var hasOwnProperty2 = Object.prototype.hasOwnProperty;
var loggedTypeFailures = {};
var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

function setCurrentlyValidatingElement(element) {
  if (element) {
    var owner = element._owner;
    var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
    ReactDebugCurrentFrame.setExtraStackFrame(stack);
  } else {
    ReactDebugCurrentFrame.setExtraStackFrame(null);
  }
}

function checkPropTypes(typeSpecs, values, location, componentName, element) {
  var has = Function.call.bind(hasOwnProperty2);
  for (var typeSpecName in typeSpecs) {
    if (has(typeSpecs, typeSpecName)) {
      var error$1 = void 0;
      try {
        if (typeof typeSpecs[typeSpecName] !== "function") {
          var err = new Error(
            (componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`. This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
          );
          err.name = "Invariant Violation";
          throw err;
        }
        error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
      } catch (ex) {
        error$1 = ex;
      }
      if (error$1 && !(error$1 instanceof Error)) {
        setCurrentlyValidatingElement(element);
        console.error(
          "%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).",
          componentName || "React class",
          location,
          typeSpecName,
          typeof error$1
        );
        setCurrentlyValidatingElement(null);
      }
      if (error$1 instanceof Error) {
        // Log the error for debugging purposes
        console.error("Prop type validation error:", error$1);
      }
    }
  }
}if (error$1 && !(error$1.message in loggedTypeFailures)) {
  loggedTypeFailures[error$1.message] = true;
  setCurrentlyValidatingElement(element);
  console.error("Failed %s type: %s", location, error$1.message);
  setCurrentlyValidatingElement(null);
}

const isArrayImpl = Array.isArray;
function isArray(a) {
  return isArrayImpl(a);
}

function typeName(value) {
  const hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
  const type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
  return type;
}

function willCoercionThrow(value) {
  try {
    testStringCoercion(value);
    return false;
  } catch (e) {
    return true;
  }
}

function testStringCoercion(value) {
  return "" + value;
}

function checkKeyStringCoercion(value) {
  if (willCoercionThrow(value)) {
    console.error("The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", typeName(value));
    return testStringCoercion(value);
  }
}

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};

let specialPropKeyWarningShown;
let specialPropRefWarningShown;
let didWarnAboutStringRefs = {};

function hasValidRef(config) {
  if (Object.prototype.hasOwnProperty.call(config, "ref")) {
    const getter = Object.getOwnPropertyDescriptor(config, "ref").get;
    if (getter && getter.isReactWarning) {
      return false;
    }
  }
  return config.ref !== undefined;
}

function hasValidKey(config) {
  if (Object.prototype.hasOwnProperty.call(config, "key")) {
    const getter = Object.getOwnPropertyDescriptor(config, "key").get;
    if (getter && getter.isReactWarning) {
      return false;
    }
  }
  return config.key !== undefined;
}

function warnIfStringRefCannotBeAutoConverted(config, self) {
  if (typeof config.ref === "string" && ReactCurrentOwner.current && self && ReactCurrentOwner.current.stateNode !== self) {
    const componentName = getComponentNameFromType(ReactCurrentOwner.current.type);
    if (!didWarnAboutStringRefs[componentName]) {
      console.error('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release.', componentName, config.ref);
      didWarnAboutStringRefs[componentName] = true;
    }
  }
}// Import necessary React hooks
import React, { useRef } from 'react';

// Function to define a warning getter for the 'key' prop
function defineKeyPropWarningGetter(props, displayName) {
  if (process.env.NODE_ENV !== 'production') {
    let specialPropKeyWarningShown = false;
    const warnAboutAccessingKey = function() {
      if (!specialPropKeyWarningShown) {
        specialPropKeyWarningShown = true;
        console.error(
          "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)",
          displayName
        );
      }
    };
    warnAboutAccessingKey.isReactWarning = true;
    Object.defineProperty(props, "key", {
      get: warnAboutAccessingKey,
      configurable: true
    });
  }
}

// Function to define a warning getter for the 'ref' prop
function defineRefPropWarningGetter(props, displayName) {
  if (process.env.NODE_ENV !== 'production') {
    let specialPropRefWarningShown = false;
    const warnAboutAccessingRef = function() {
      if (!specialPropRefWarningShown) {
        specialPropRefWarningShown = true;
        console.error(
          "%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)",
          displayName
        );
      }
    };
    warnAboutAccessingRef.isReactWarning = true;
    Object.defineProperty(props, "ref", {
      get: warnAboutAccessingRef,
      configurable: true
    });
  }
}

// ReactElement function to create a React element
const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: Symbol.for('react.element'),
    // Built-in properties that belong on the element
    type,
    key,
    ref,
    props,
    // Record the component responsible for creating this element.
    _owner: owner
  };

  if (process.env.NODE_ENV !== 'production') {
    element._store = {};
    Object.defineProperty(element._store, "validated", {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false
    });
    Object.defineProperty(element, "_self", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self
    });
    Object.defineProperty(element, "_source", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source
    });
  }

  return element;
};

export { defineKeyPropWarningGetter, defineRefPropWarningGetter, ReactElement };false,
writable: false,
value: source
});
if (Object.freeze) {
  Object.freeze(element.props);
  Object.freeze(element);
}
return element;
};

function jsxDEV3(type, config, maybeKey, source, self) {
  var propName;
  var props = {};
  var key = null;
  var ref = null;

  if (maybeKey !== undefined) {
    checkKeyStringCoercion(maybeKey);
    key = "" + maybeKey;
  }

  if (hasValidKey(config)) {
    checkKeyStringCoercion(config.key);
    key = "" + config.key;
  }

  if (hasValidRef(config)) {
    ref = config.ref;
    warnIfStringRefCannotBeAutoConverted(config, self);
  }

  for (propName in config) {
    if (hasOwnProperty2.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
      props[propName] = config[propName];
    }
  }

  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  if (key || ref) {
    var displayName = typeof type === "function" ? type.displayName || type.name || "Unknown" : type;
    if (key) {
      defineKeyPropWarningGetter(props, displayName);
    }
    if (ref) {
      defineRefPropWarningGetter(props, displayName);
    }
  }

  return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
}

var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;

function setCurrentlyValidatingElement$1(element) {
  if (element) {
    var owner = element._owner;
    var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
    ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
  } else {
    ReactDebugCurrentFrame$1.setExtraStackFrame(null);
  }
}

var propTypesMisspellWarningShown = false;

function isValidElement(object) {
  return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}

function getDeclarationErrorAddendum() {
  if (ReactCurrentOwner$1.current) {
    var name = getComp;
  }
}function getComponentNameFromType(type) {
  return type.displayName || type.name || 'Unknown';
}

function getDeclarationErrorAddendum() {
  if (ReactCurrentOwner$1.current) {
    const name = getComponentNameFromType(ReactCurrentOwner$1.current.type);
    if (name) {
      return `\n\nCheck the render method of \`${name}\`.`;
    }
  }
  return '';
}

function getSourceInfoErrorAddendum(source) {
  if (source !== undefined) {
    const fileName = source.fileName.replace(/^.*[\\\/]/, '');
    const lineNumber = source.lineNumber;
    return `\n\nCheck your code at ${fileName}:${lineNumber}.`;
  }
  return '';
}

const ownerHasKeyUseWarning = {};

function getCurrentComponentErrorInfo(parentType) {
  let info = getDeclarationErrorAddendum();
  if (!info) {
    const parentName = typeof parentType === 'string' ? parentType : getComponentNameFromType(parentType);
    if (parentName) {
      info = `\n\nCheck the top-level render call using <${parentName}>.`;
    }
  }
  return info;
}

function validateExplicitKey(element, parentType) {
  if (!element._store || element._store.validated || element.key != null) {
    return;
  }
  element._store.validated = true;

  const currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
  if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
    return;
  }
  ownerHasKeyUseWarning[currentComponentErrorInfo] = true;

  let childOwner = '';
  if (element && element._owner && element._owner !== ReactCurrentOwner$1.current) {
    childOwner = ` It was passed a child from ${getComponentNameFromType(element._owner.type)}.`;
  }

  setCurrentlyValidatingElement$1(element);
  error(
    'Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.',
    currentComponentErrorInfo,
    childOwner
  );
  setCurrentlyValidatingElement$1(null);
}

function validateChildKeys(node, parentType) {
  if (typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const child = node[i];
      if (isValidElement(child)) {
        validateExplicitKey(child, parentType);
      }
    }
  } else if (isValidElement(node)) {
    if (node._store) {
      node._store.validated = true;
    }
  } else if (node) {
    const iteratorFn = getIteratorFn(node);
    if (typeof iteratorFn === 'function') {
      if (iteratorFn !== node.entries) {
        const iterator = iteratorFn.call(node);
        let step;
        // Additional logic for iterators can be added here if needed
      }
    }
  }
}while (!(step = iterator.next()).done) {
  if (isValidElement(step.value)) {
    validateExplicitKey(step.value, parentType);
  }
}

function validatePropTypes(element) {
  const type = element.type;
  if (type === null || type === undefined || typeof type === "string") {
    return;
  }
  
  let propTypes;
  if (typeof type === "function") {
    propTypes = type.propTypes;
  } else if (typeof type === "object" && (type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_MEMO_TYPE)) {
    propTypes = type.propTypes;
  } else {
    return;
  }
  
  if (propTypes) {
    const name = getComponentNameFromType(type);
    checkPropTypes(propTypes, element.props, "prop", name, element);
  } else if (type.PropTypes !== undefined && !propTypesMisspellWarningShown) {
    propTypesMisspellWarningShown = true;
    const name = getComponentNameFromType(type);
    error("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", name || "Unknown");
  }
  
  if (typeof type.getDefaultProps === "function" && !type.getDefaultProps.isReactClassApproved) {
    error("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
  }
}

function validateFragmentProps(fragment) {
  const keys = Object.keys(fragment.props);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key !== "children" && key !== "key") {
      setCurrentlyValidatingElement$1(fragment);
      error("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", key);
      setCurrentlyValidatingElement$1(null);
      break;
    }
  }
  
  if (fragment.ref !== null) {
    setCurrentlyValidatingElement$1(fragment);
    error("Invalid attribute `ref` supplied to `React.Fragment`.");
    setCurrentlyValidatingElement$1(null);
  }
}

function jsxWithValidation(type, props, key, isStaticChildren, source, self) {
  const validType = isValidElementType(type);
  if (!validType) {
    let info = "";
    if (type === undefined || (typeof type === "object" && type !== null && Object.keys(type).length === 0)) {
      info += " You likely forgot to export your component from the file.";
    }
    // Additional error handling or logging can be added here
  }
}agment; // Corrected variable name from Fragment2 to Fragment

// Ensure all necessary imports are present
import { jsxDEV as jsxDEV$1 } from 'react/jsx-dev-runtime';
import { REACT_FRAGMENT_TYPE } from 'react';
import { validateChildKeys, validateFragmentProps, validatePropTypes } from './validation'; // Assuming these are defined in a validation module
import { isArray, getComponentNameFromType, getSourceInfoErrorAddendum, getDeclarationErrorAddendum } from './utils'; // Assuming these are defined in a utils module

// Corrected function to ensure proper validation and error handling
function jsxWithValidation(type, props, key, source, self) {
  let validType = typeof type === 'string' || typeof type === 'function';

  if (!validType) {
    let info = '';
    if (type === undefined || (typeof type === 'object' && type !== null && !Array.isArray(type))) {
      info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
    }
    const sourceInfo = getSourceInfoErrorAddendum(source);
    if (sourceInfo) {
      info += sourceInfo;
    } else {
      info += getDeclarationErrorAddendum();
    }
    let typeString;
    if (type === null) {
      typeString = "null";
    } else if (isArray(type)) {
      typeString = "array";
    } else if (type !== void 0 && type.$$typeof === REACT_ELEMENT_TYPE) {
      typeString = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
      info = " Did you accidentally export a JSX literal instead of a component?";
    } else {
      typeString = typeof type;
    }
    console.error("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", typeString, info);
  }

  const element = jsxDEV$1(type, props, key, source, self);
  if (element == null) {
    return element;
  }
  if (validType) {
    const children = props.children;
    if (children !== void 0) {
      if (Array.isArray(children)) {
        for (let i = 0; i < children.length; i++) {
          validateChildKeys(children[i], type);
        }
        if (Object.freeze) {
          Object.freeze(children);
        }
      } else {
        console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
      }
    } else {
      validateChildKeys(children, type);
    }
  }
  if (type === REACT_FRAGMENT_TYPE) {
    validateFragmentProps(element);
  } else {
    validatePropTypes(element);
  }
  return element;
}

// Export corrected functions and constants
export const Fragment = REACT_FRAGMENT_TYPE;
export const jsxDEV = jsxWithValidation;import { Fragment as Fragment2 } from 'react'; // Ensure Fragment is imported from 'react'
import * as ReactJSXRuntimeDev from 'react/jsx-dev-runtime'; // Import the necessary runtime
import { Emotion$1, createEmotionProps } from '@emotion/react'; // Import Emotion components

function jsxDEV2(type, props, key, isStaticChildren, source, self) {
  if (!Object.prototype.hasOwnProperty.call(props, "css")) { // Use Object.prototype.hasOwnProperty for safety
    return ReactJSXRuntimeDev.jsxDEV(type, props, key, isStaticChildren, source, self);
  }
  return ReactJSXRuntimeDev.jsxDEV(Emotion$1, createEmotionProps(type, props), key, isStaticChildren, source, self);
}

export {
  Fragment2 as Fragment,
  jsxDEV2 as jsxDEV
};

/*! Bundled license information:

react/cjs/react-jsx-dev-runtime.development.js:
  (**
   * @license React
   * react-jsx-dev-runtime.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=@emotion_react_jsx-dev-runtime.js.map