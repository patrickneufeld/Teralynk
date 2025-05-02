import {
  __commonJS
} from "./chunk-3EJPJMEH.js";

// node_modules/react-is/cjs/react-is.development.js
var require_react_is_development = __commonJS({
  "node_modules/react-is/cjs/react-is.development.js"(exports) {
    "use strict";
    if (true) {
      (function() {
        "use strict";
        var hasSymbol = typeof Symbol === "function" && Symbol.for;
        var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for("react.element") : 60103;
        var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for("react.portal") : 60106;
        var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for("react.fragment") : 60107;
        var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for("react.strict_mode") : 60108;
        var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for("react.profiler") : 60114;
        var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for("react.provider") : 60109;
        var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for("react.context") : 60110;
        var REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for("react.async_mode") : 60111;
        var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for("react.concurrent_mode") : 60111;
        var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for("react.forward_ref") : 60112;
        var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for("react.suspense") : 60113;
        var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for("react.suspense_list") : 60120;
        var REACT_MEMO_TYPE = hasSymbol ? Symbol.for("react.memo") : 60115;
        var REACT_LAZY_TYPE = hasSymbol ? Symbol.for("react.lazy") : 60116;
        var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for("react.block") : 60121;
        var REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for("react.fundamental") : 60117;
        var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for("react.responder") : 60118;
        var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for("react.scope") : 60119;

        function isValidElementType(type) {
          return typeof type === "string" || typeof type === "function" || 
            type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || 
            type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || 
            type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || 
            (typeof type === "object" && type !== null && 
              (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || 
               type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || 
               type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || 
               type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || 
               type.$$typeof === REACT_BLOCK_TYPE));
        }

        function typeOf(object) {
          if (typeof object === "object" && object !== null) {
            var $$typeof = object.$$typeof;
            switch ($$typeof) {
              case REACT_ELEMENT_TYPE:
                var type = object.type;
                switch (type) {
                  // Add cases for other types if necessary
                  default:
                    return $$typeof;
                }
              // Add cases for other $$typeof values if necessary
              default:
                return undefined;
            }
          }
          return undefined;
        }

        exports.isValidElementType = isValidElementType;
        exports.typeOf = typeOf;
      })();
    }
  }
});// Improved code with fixes and optimizations

// Constants for React types
const REACT_ASYNC_MODE_TYPE = Symbol.for('react.async_mode');
const REACT_CONCURRENT_MODE_TYPE = Symbol.for('react.concurrent_mode');
const REACT_CONTEXT_TYPE = Symbol.for('react.context');
const REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
const REACT_LAZY_TYPE = Symbol.for('react.lazy');
const REACT_MEMO_TYPE = Symbol.for('react.memo');
const REACT_PROVIDER_TYPE = Symbol.for('react.provider');
const REACT_ELEMENT_TYPE = Symbol.for('react.element');
const REACT_PORTAL_TYPE = Symbol.for('react.portal');
const REACT_PROFILER_TYPE = Symbol.for('react.profiler');
const REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
const REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');

// Function to determine the type of a React element
function typeOf(object) {
  if (typeof object === 'object' && object !== null) {
    const type = object.$$typeof;
    switch (type) {
      case REACT_ELEMENT_TYPE:
        const elementType = object.type;
        switch (elementType) {
          case REACT_ASYNC_MODE_TYPE:
          case REACT_CONCURRENT_MODE_TYPE:
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
            return elementType;
          default:
            const $$typeofType = elementType && elementType.$$typeof;
            switch ($$typeofType) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
              case REACT_PROVIDER_TYPE:
                return $$typeofType;
              default:
                return type;
            }
        }
      case REACT_PORTAL_TYPE:
        return type;
    }
  }
  return undefined;
}

// Deprecated warning flag
let hasWarnedAboutDeprecatedIsAsyncMode = false;

// Function to check if an object is in async mode
function isAsyncMode(object) {
  if (!hasWarnedAboutDeprecatedIsAsyncMode) {
    hasWarnedAboutDeprecatedIsAsyncMode = true;
    console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.");
  }
  return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
}

// Function to check if an object is in concurrent mode
function isConcurrentMode(object) {
  return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
}

// Function to check if an object is a context consumer
function isContextConsumer(object) {
  return typeOf(object) === REACT_CONTEXT_TYPE;
}

// Function to check if an object is a context provider
function isContextProvider(object) {
  return typeOf(object) === REACT_PROVIDER_TYPE;
}

// Function to check if an object is a React element
function isElement(object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}

// Function to check if an object is a forward ref
function isForwardRef(object) {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}

// Function to check if an object is a fragment
function isFragment(object) {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}

// Function to check if an object is lazy
function isLazy(object) {
  return typeOf(object) === REACT_LAZY_TYPE;
}

// Function to check if an object is memoized
function isMemo(object) {
  return typeOf(object) === REACT_MEMO_TYPE;
}// node_modules/react-is/index.js
var require_react_is = __commonJS({
  "node_modules/react-is/index.js"(exports, module) {
    "use strict";
    // Check if the environment is production or development
    // This is typically handled by the bundler
    if (process.env.NODE_ENV === 'production') {
      module.exports = null; // Production build logic
    } else {
      module.exports = require_react_is_development(); // Development build logic
    }
  }
});

// Export the require function for react-is
export {
  require_react_is
};

/*! Bundled license information:

react-is/cjs/react-is.development.js:
  (** @license React v16.13.1
   * react-is.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=chunk-DSUTBUCJ.js.map