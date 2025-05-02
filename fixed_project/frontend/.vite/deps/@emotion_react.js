import {
  CacheProvider,
  Emotion$1,
  ThemeContext,
  ThemeProvider,
  __unsafe_useEmotionCache,
  createEmotionProps,
  getRegisteredStyles,
  hasOwnProperty,
  insertStyles,
  isBrowser,
  registerStyles,
  require_hoist_non_react_statics_cjs,
  serializeStyles,
  useInsertionEffectAlwaysWithSyncFallback,
  useInsertionEffectWithLayoutFallback,
  useTheme,
  withEmotionCache,
  withTheme
} from "./chunk-ACWNJTZF.js";
import "./chunk-DSUTBUCJ.js";
import {
  require_react
} from "./chunk-UPB6Y4P2.js";
import {
  __toESM
} from "./chunk-3EJPJMEH.js";

// node_modules/@emotion/react/dist/emotion-react.browser.esm.js
var React = __toESM(require_react());
var import_hoist_non_react_statics = __toESM(require_hoist_non_react_statics_cjs());
var pkg = {
  name: "@emotion/react",
  version: "11.11.1",
  main: "dist/emotion-react.cjs.js",
  module: "dist/emotion-react.esm.js",
  browser: {
    "./dist/emotion-react.esm.js": "./dist/emotion-react.browser.esm.js"
  },
  exports: {
    ".": {
      module: {
        worker: "./dist/emotion-react.worker.esm.js",
        browser: "./dist/emotion-react.browser.esm.js",
        "default": "./dist/emotion-react.esm.js"
      },
      "import": "./dist/emotion-react.cjs.mjs",
      "default": "./dist/emotion-react.cjs.js"
    },
    "./jsx-runtime": {
      module: {
        worker: "./jsx-runtime/dist/emotion-react-jsx-runtime.worker.esm.js",
        browser: "./jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js",
        "default": "./jsx-runtime/dist/emotion-react-jsx-runtime.esm.js"
      },
      "import": "./jsx-runtime/dist/emotion-react-jsx-runtime.cjs.mjs",
      "default": "./jsx-runtime/dist/emotion-react-jsx-runtime.cjs.js"
    },
    "./_isolated-hnrs": {
      module: {
        worker: "./_isolated-hnrs/dist/emotion-react-_isolated-hnrs.worker.esm.js",
        browser: "./_isolated-hnrs/dist/emotion-react-_isolated-hnrs.browser.esm.js",
        "default": "./_isolated-hnrs/dist/emotion-react-_isolated-hnrs.esm.js"
      },
      "import": "./_isolated-hnrs/dist/emotion-react-_isolated-hnrs.cjs.mjs",
      "default": "./_isolated-hnrs/dist/emotion-react-_isolated-hnrs.cjs.js"
    },
    "./jsx-dev-runtime": {
      module: {
        worker: "./jsx-dev-runtime/dist/emotion-react-jsx-dev-runtime.worker.esm.js",
        browser: "./jsx-dev-runtime/dist/emotion-react-jsx-dev-runtime.browser.esm.js",
        "default": "./jsx-dev-runtime/dist/emotion-react-jsx-dev-runtime.esm.js"
      },
      "import": "./jsx-dev-runtime/dist/emotion-react-jsx-dev-runtime.cjs.mjs",
      "default": "./jsx-dev-runtime/dist/emotion-react-jsx-dev-runtime.cjs.js"
    },
    "./package.json": "./package.json",
    "./types/css-prop": "./types/css-prop.d.ts",
    "./macro": {
      types: {
        "import": "./macro.d.mts",
        "default": "./macro.d.ts"
      },
      "default": "./macro.js"
    }
  },
  types: "types/index.d.ts",
  files: [
    "src",
    "dist",
    "jsx-runtime",
    "jsx-dev-runtime",
    "types",
    "macro"
  ]
};{
  "name": "emotion-react",
  "version": "11.11.0",
  "main": "dist/emotion-react.cjs.js",
  "module": "dist/emotion-react.esm.js",
  "types": "types/index.d.ts",
  "files": [
    "dist",
    "src",
    "types/*.d.ts",
    "macro.*"
  ],
  "sideEffects": false,
  "author": "Emotion Contributors",
  "license": "MIT",
  "scripts": {
    "test:typescript": "dtslint types"
  },
  "dependencies": {
    "@babel/runtime": "^7.18.3",
    "@emotion/babel-plugin": "^11.11.0",
    "@emotion/cache": "^11.11.0",
    "@emotion/serialize": "^1.1.2",
    "@emotion/use-insertion-effect-with-fallbacks": "^1.0.1",
    "@emotion/utils": "^1.2.1",
    "@emotion/weak-memoize": "^0.3.1",
    "hoist-non-react-statics": "^3.3.1"
  },
  "peerDependencies": {
    "react": ">=16.8.0"
  },
  "peerDependenciesMeta": {
    "@types/react": {
      "optional": true
    }
  },
  "devDependencies": {
    "@definitelytyped/dtslint": "0.0.112",
    "@emotion/css": "11.11.0",
    "@emotion/css-prettifier": "1.1.3",
    "@emotion/server": "11.11.0",
    "@emotion/styled": "11.11.0",
    "html-tag-names": "^1.1.2",
    "react": "16.14.0",
    "svg-tag-names": "^1.1.1",
    "typescript": "^4.5.5"
  },
  "repository": "https://github.com/emotion-js/emotion/tree/main/packages/react",
  "publishConfig": {
    "access": "public"
  },
  "umd:main": "dist/emotion-react.umd.min.js",
  "preconstruct": {
    "entrypoints": [
      "./index.js",
      "./jsx-runtime.js",
      "./jsx-dev-runtime.js",
      "./_isolated-hnrs.js"
    ],
    "umdName": "emotionReact",
    "exports": {
      "envConditions": [
        "browser",
        "worker"
      ],
      "extra": {
        "./types/css-prop": "./types/css-prop.d.ts",
        "./macro": {
          "types": {
            "import": "./macro.d.mts",
            "default": "./macro.d.ts"
          },
          "default": "./macro.js"
        }
      }
    }
  }
}

var jsx = function jsx2(type, props) {
  var args = arguments;
  if (props == null || !Object.prototype.hasOwnProperty.call(props, "css")) {
    return React.createElement.apply(void 0, args);
  }
  var argsLength = args.length;
  var createElementArgArray = new Array(argsLength);
  createElementArgArray[0] = Emotion$1;
  createElementArgArray[1] = createEmotionProps(type, props);
  for (var i = 2; i < argsLength; i++) {
    createElementArgArray[i] = args[i];
  }
  return React.createElement.apply(null, createElementArgArray);
};

var warnedAboutCssPropForGlobal = false;
var Global = withEmotionCache(function(props, cache) {
  if (!warnedAboutCssPropForGlobal && (props.className || props.css)) {
    console.error("It looks like you're using the css prop on Global, did you mean to use the styles prop instead?");
    warnedAboutCssPropForGlobal = true;
  }
  var styles = props.styles;
  var serialized = serializeStyles([styles], void 0, React.useContext(ThemeContext));
  if (!isBrowser) {
    var _ref;
    var serializedNames = serialized.name;
    var serializedStyles = serialized.styles;
    // Additional logic for server-side rendering can be added here
  }
  // Additional logic for client-side rendering can be added here
});const next = serialized.next;
while (next !== undefined) {
  serializedNames += " " + next.name;
  serializedStyles += next.styles;
  next = next.next;
}

const shouldCache = cache.compat === true;
const rules = cache.insert("", {
  name: serializedNames,
  styles: serializedStyles
}, cache.sheet, shouldCache);

if (shouldCache) {
  return null;
}

return React.createElement("style", {
  "data-emotion": `${cache.key}-global ${serializedNames}`,
  dangerouslySetInnerHTML: {
    __html: rules
  },
  nonce: cache.sheet.nonce
});

const sheetRef = React.useRef();

useInsertionEffectWithLayoutFallback(() => {
  const key = `${cache.key}-global`;
  const sheet = new cache.sheet.constructor({
    key,
    nonce: cache.sheet.nonce,
    container: cache.sheet.container,
    speedy: cache.sheet.isSpeedy
  });

  let rehydrating = false;
  const node = document.querySelector(`style[data-emotion="${key} ${serialized.name}"]`);

  if (cache.sheet.tags.length) {
    sheet.before = cache.sheet.tags[0];
  }

  if (node !== null) {
    rehydrating = true;
    node.setAttribute("data-emotion", key);
    sheet.hydrate([node]);
  }

  sheetRef.current = [sheet, rehydrating];

  return () => {
    sheet.flush();
  };
}, [cache]);

useInsertionEffectWithLayoutFallback(() => {
  const [sheet, rehydrating] = sheetRef.current;

  if (rehydrating) {
    sheetRef.current[1] = false;
    return;
  }

  if (serialized.next !== undefined) {
    insertStyles(cache, serialized.next, true);
  }

  if (sheet.tags.length) {
    const element = sheet.tags[sheet.tags.length - 1].nextElementSibling;
    sheet.before = element;
    sheet.flush();
  }

  cache.insert("", serialized, sheet, false);
}, [cache, serialized.name]);

return null;

if (process.env.NODE_ENV !== 'production') {
  Global.displayName = "EmotionGlobal";
}

function css(...args) {
  return serializeStyles(args);
}

const keyframes = function (...args) {
  const insertable = css(...args);
  const name = `animation-${insertable.name}`;
  return {
    name,
    styles: `@keyframes ${name} {${insertable.styles}}`,
    anim: 1,
    toString() {
      return `_EMO_${this.name}_${this.styles}_EMO_`;
    }
  };
};

const classnames = function (args) {
  let cls = "";
  for (const arg of args) {
    if (arg == null) continue;
    let toAdd;
    switch (typeof arg) {
      case "boolean":
        break;
      case "object":
        if (Array.isArray(arg)) {
          toAdd = classnames(arg);
        } else if (arg.styles !== undefined && arg.name !== undefined) {
          // Assuming this is a valid style object
          toAdd = `${arg.name}`;
        }
        break;
      default:
        toAdd = arg;
    }
    if (toAdd) {
      cls += (cls ? " " : "") + toAdd;
    }
  }
  return cls;
};console.error("You have passed styles created with `css` from `@emotion/react` package to the `cx`.\n`cx` is meant to compose class names (strings) so you should convert those styles to a class name by passing them to the `css` received from <ClassNames/> component.");

let toAdd = "";
for (let k in arg) {
  if (arg[k] && k) {
    toAdd && (toAdd += " ");
    toAdd += k;
  }
}

if (toAdd) {
  cls && (cls += " ");
  cls += toAdd;
}

return cls;
}

function merge(registered, css2, className) {
  const registeredStyles = [];
  const rawClassName = getRegisteredStyles(registered, registeredStyles, className);
  if (registeredStyles.length < 2) {
    return className;
  }
  return rawClassName + css2(registeredStyles);
}

const Insertion = function Insertion2({ cache, serializedArr }) {
  useInsertionEffectAlwaysWithSyncFallback(() => {
    for (let i = 0; i < serializedArr.length; i++) {
      insertStyles(cache, serializedArr[i], false);
    }
  });
  return null;
};

const ClassNames = withEmotionCache(function(props, cache) {
  let hasRendered = false;
  const serializedArr = [];
  const css2 = function css3(...args) {
    if (hasRendered) {
      throw new Error("css can only be used during render");
    }
    const serialized = serializeStyles(args, cache.registered);
    serializedArr.push(serialized);
    registerStyles(cache, serialized, false);
    return cache.key + "-" + serialized.name;
  };

  const cx = function cx2(...args) {
    if (hasRendered) {
      throw new Error("cx can only be used during render");
    }
    return merge(cache.registered, css2, classnames(args));
  };

  const content = {
    css: css2,
    cx,
    theme: React.useContext(ThemeContext)
  };

  const ele = props.children(content);
  hasRendered = true;
  return (
    <React.Fragment>
      <Insertion cache={cache} serializedArr={serializedArr} />
      {ele}
    </React.Fragment>
  );
});

if (process.env.NODE_ENV !== "production") {
  ClassNames.displayName = "EmotionClassNames";
}

if (typeof window !== "undefined" && typeof jest === "undefined" && typeof vi === "undefined") {
  const globalContext = typeof globalThis !== "undefined" ? globalThis : window;
  const globalKey = "__EMOTION_REACT_" + pkg.version.split(".")[0] + "__";
  if (globalContext[globalKey]) {
    console.warn("You are loading @emotion/react when it is already loaded. Running multiple instances may cause problems. This can happen if multiple versions are used, or if multiple build tools are involved.");
  }
}export {
  CacheProvider,
  ClassNames,
  Global,
  ThemeContext,
  ThemeProvider,
  __unsafe_useEmotionCache,
  jsx as createElement,
  css,
  jsx,
  keyframes,
  useTheme,
  withEmotionCache,
  withTheme
};
//# sourceMappingURL=@emotion_react.js.map