import {
  require_react_is
} from "./chunk-DSUTBUCJ.js";
import {
  require_react
} from "./chunk-UPB6Y4P2.js";
import {
  __commonJS,
  __toESM
} from "./chunk-3EJPJMEH.js";

// node_modules/hoist-non-react-statics/dist/hoist-non-react-statics.cjs.js
var require_hoist_non_react_statics_cjs = __commonJS({
  "node_modules/hoist-non-react-statics/dist/hoist-non-react-statics.cjs.js"(exports, module) {
    "use strict";
    var reactIs = require_react_is();
    var REACT_STATICS = {
      childContextTypes: true,
      contextType: true,
      contextTypes: true,
      defaultProps: true,
      displayName: true,
      getDefaultProps: true,
      getDerivedStateFromError: true,
      getDerivedStateFromProps: true,
      mixins: true,
      propTypes: true,
      type: true
    };
    var KNOWN_STATICS = {
      name: true,
      length: true,
      prototype: true,
      caller: true,
      callee: true,
      arguments: true,
      arity: true
    };
    var FORWARD_REF_STATICS = {
      "$$typeof": true,
      render: true,
      defaultProps: true,
      displayName: true,
      propTypes: true
    };
    var MEMO_STATICS = {
      "$$typeof": true,
      compare: true,
      defaultProps: true,
      displayName: true,
      propTypes: true,
      type: true
    };
    var TYPE_STATICS = {};
    TYPE_STATICS[reactIs.ForwardRef] = FORWARD_REF_STATICS;
    TYPE_STATICS[reactIs.Memo] = MEMO_STATICS;
    function getStatics(component) {
      if (reactIs.isMemo(component)) {
        return MEMO_STATICS;
      }
      return TYPE_STATICS[component["$$typeof"]] || REACT_STATICS;
    }
    var defineProperty = Object.defineProperty;
    var getOwnPropertyNames = Object.getOwnPropertyNames;
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    var getPrototypeOf = Object.getPrototypeOf;
    var objectPrototype = Object.prototype;
    function hoistNonReactStatics2(targetComponent, sourceComponent, blacklist) {
      if (typeof sourceComponent !== "string") {
        if (objectPrototype) {
          var inheritedComponent = getPrototypeOf(sourceComponent);
          if (inheritedComponent && inheritedComponent !== objectPrototype) {
            hoistNonReactStatics2(targetComponent, inheritedComponent, blacklist);
          }
        }
        var keys = getOwnPropertyNames(sourceComponent);
        if (getOwnPropertySymbols) {
          keys = keys.concat(getOwnPropertySymbols(sourceComponent));
        }
        var targetStatics = getStatics(targetComponent);
        var sourceStatics = getStatics(sourceComponent);
        for (var i = 0; i < keys.length; ++i) {
          var key = keys[i];
          if (!KNOWN_STATICS[key] && !(blacklist && blacklist[key]) && !(sourceStatics && sourceStatics[key]) && !(targetStatics && targetStatics[key])) {
            var descriptor = getOwnPropertyDescriptor(sourceComponent, key);
            try {
              defineProperty(targetComponent, key, descriptor);
            } catch (e) {
              // Handle errors gracefully
              console.error(`Failed to define property ${key} on target component:`, e);
            }
          }
        }
      }
      return targetComponent;
    }
    module.exports = hoistNonReactStatics2;
  }
});tComponent, key, descriptor);
            } catch (e) {
              console.error("Error hoisting non-react statics:", e);
            }
          }
        }
      }
      return targetComponent;
    }
    module.exports = hoistNonReactStatics2;
  }
});

// node_modules/@emotion/sheet/dist/emotion-sheet.development.esm.js
var isDevelopment = process.env.NODE_ENV !== 'production'; // Use environment variable to determine development mode
function sheetForTag(tag) {
  if (tag.sheet) {
    return tag.sheet;
  }
  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].ownerNode === tag) {
      return document.styleSheets[i];
    }
  }
  return void 0;
}
function createStyleElement(options) {
  var tag = document.createElement("style");
  tag.setAttribute("data-emotion", options.key);
  if (options.nonce !== void 0) {
    tag.setAttribute("nonce", options.nonce);
  }
  tag.appendChild(document.createTextNode(""));
  tag.setAttribute("data-s", "");
  return tag;
}
var StyleSheet = function() {
  function StyleSheet2(options) {
    var _this = this;
    this._insertTag = function(tag) {
      var before;
      if (_this.tags.length === 0) {
        if (_this.insertionPoint) {
          before = _this.insertionPoint.nextSibling;
        } else if (_this.prepend) {
          before = _this.container.firstChild;
        } else {
          before = _this.before;
        }
      } else {
        before = _this.tags[_this.tags.length - 1].nextSibling;
      }
      _this.container.insertBefore(tag, before);
      _this.tags.push(tag);
    };
    this.isSpeedy = options.speedy === void 0 ? !isDevelopment : options.speedy;
    this.tags = [];
    this.ctr = 0;
    this.nonce = options.nonce;
    this.key = options.key;
    this.container = options.container;
    this.prepend = options.prepend;
    this.insertionPoint = options.insertionPoint;
    this.before = null;
  }
  var _proto = StyleSheet2.prototype;
  _proto.hydrate = function hydrate(nodes) {
    nodes.forEach(this._insertTag);
  };
  _proto.insert = function insert(rule) {
    if (this.ctr % (this.isSpeedy ? 65e3 : 1) === 0) {
      this._insertTag(createStyleElement(this));
    }
    var tag = this.tags[this.tags.length - 1];
    {
      var isImportRule3 = rule.charCodeAt(0) === 64 && rule.charCodeAt(1) === 105;
      if (isImportRule3 && this._alreadyInsertedOrderInsensitiveRule) {
        console.error("You're attempting to insert the following rule:\n" + rule + "\n\n`@import` rules must be before all other types of rules in a stylesheet but other rules have already been inserted. Please ensure that `@import` rules are before all other rules.");
      }
      this._alreadyInsertedOrderInsensitiveRule = this._alreadyInsertedOrderInsensitiveRule || !isImportRule3;
    }
    if (this.isSpeedy) {
      var sheet = sheetForTag(tag);
      try {
        sheet.insertRule(rule, sheet.cssRules.length);
      } catch (e) {
        if (!/:(-moz-placeholder|-moz-focus-inner|-moz-focusring|-ms-input-placeholder|-moz-read-write|-moz-read-only|-ms-clear|-ms-expand|-ms-reveal){/.test(rule)) {
          console.error('There was a problem inserting the rule:', rule, e);
        }
      }
    } else {
      tag.appendChild(document.createTextNode(rule));
    }
    this.ctr++;
  };
  _proto.flush = function flush() {
    this.tags.forEach(function(tag) {
      tag.parentNode.removeChild(tag);
    });
    this.tags = [];
    this.ctr = 0;
  };
  return StyleSheet2;
}();lem inserting the following rule: "' + rule + '"', e);
        }
      }
    } else {
      tag.appendChild(document.createTextNode(rule));
    }
    this.ctr++;
  };

  _proto.flush = function flush() {
    this.tags.forEach(function(tag) {
      var _tag$parentNode;
      return (_tag$parentNode = tag.parentNode) == null ? void 0 : _tag$parentNode.removeChild(tag);
    });
    this.tags = [];
    this.ctr = 0;
    {
      this._alreadyInsertedOrderInsensitiveRule = false;
    }
  };

  return StyleSheet2;
}();

// node_modules/stylis/src/Enum.js
var MS = "-ms-";
var MOZ = "-moz-";
var WEBKIT = "-webkit-";
var COMMENT = "comm";
var RULESET = "rule";
var DECLARATION = "decl";
var IMPORT = "@import";
var KEYFRAMES = "@keyframes";
var LAYER = "@layer";

// node_modules/stylis/src/Utility.js
var abs = Math.abs;
var from = String.fromCharCode;
var assign = Object.assign;

function hash(value, length2) {
  return charat(value, 0) ^ 45 ? (((length2 << 2 ^ charat(value, 0)) << 2 ^ charat(value, 1)) << 2 ^ charat(value, 2)) << 2 ^ charat(value, 3) : 0;
}

function trim(value) {
  return value.trim();
}

function match(value, pattern) {
  return (value = pattern.exec(value)) ? value[0] : value;
}

function replace(value, pattern, replacement) {
  return value.replace(pattern, replacement);
}

function indexof(value, search) {
  return value.indexOf(search);
}

function charat(value, index) {
  return value.charCodeAt(index) | 0;
}

function substr(value, begin, end) {
  return value.slice(begin, end);
}

function strlen(value) {
  return value.length;
}

function sizeof(value) {
  return value.length;
}

function append(value, array) {
  return array.push(value), value;
}

function combine(array, callback) {
  return array.map(callback).join("");
}

// node_modules/stylis/src/Tokenizer.js
var line = 1;
var column = 1;
var length = 0;
var position = 0;
var character = 0;
var characters = "";

function node(value, root, parent, type, props, children, length2) {
  return { value, root, parent, type, props, children, line, column, length: length2, return: "" };
}

function copy(root, props) {
  return assign(node("", null, null, "", null, null, 0), root, { length: -root.length }, props);
}

function char() {
  return character;
}

function prev() {
  character = position > 0 ? charat(characters, --position) : 0;
  if (column--, character === 10)
    column = 1, line--;
  return character;
}

function next() {
  character = position < length ? charat(characters, position++) : 0;
  if (column++, character === 10)
    column = 1, line++;
  return character;
}

function peek() {
  return charat(characters, position);
}

function caret() {
  return position;
}

function slice(begin, end) {
  return substr(characters, begin, end);
}

function token(type) {
  switch (type) {
    case 0:
    case 9:
    case 10:
    case 13:
    case 32:
      return 5;
    case 33:
    case 43:
    case 44:
    case 47:
    case 62:
    case 64:
    case 126:
    case 59:
    case 123:
    case 125:
      // Add missing return statement for token type
      return type;
    default:
      return 0;
  }
}function token(character) {
  switch (character) {
    case 58:
      return 3;
    case 34:
    case 39:
    case 40:
    case 91:
      return 2;
    case 41:
    case 93:
      return 1;
    default:
      return 0;
  }
}

function alloc(value) {
  line = column = 1;
  length = strlen(characters = value);
  position = 0;
  return [];
}

function dealloc(value) {
  characters = "";
  return value;
}

function delimit(type) {
  return trim(slice(position - 1, delimiter(type === 91 ? type + 2 : type === 40 ? type + 1 : type)));
}

function whitespace(type) {
  while ((character = peek())) {
    if (character < 33) {
      next();
    } else {
      break;
    }
  }
  return token(type) > 2 || token(character) > 3 ? "" : " ";
}

function escaping(index, count) {
  while (--count && next()) {
    if (character < 48 || character > 102 || (character > 57 && character < 65) || (character > 70 && character < 97)) {
      break;
    }
  }
  return slice(index, caret() + (count < 6 && peek() === 32 && next() === 32));
}

function delimiter(type) {
  while (next()) {
    switch (character) {
      case type:
        return position;
      case 34:
      case 39:
        if (type !== 34 && type !== 39) {
          delimiter(character);
        }
        break;
      case 40:
        if (type === 41) {
          delimiter(type);
        }
        break;
      case 92:
        next();
        break;
    }
  }
  return position;
}

function commenter(type, index) {
  while (next()) {
    if (type + character === 47 + 10) {
      break;
    } else if (type + character === 42 + 42 && peek() === 47) {
      break;
    }
  }
  return "/*" + slice(index, position - 1) + "*" + from(type === 47 ? type : next());
}

function identifier(index) {
  while (!token(peek())) {
    next();
  }
  return slice(index, position);
}

// node_modules/stylis/src/Parser.js
function compile(value) {
  return dealloc(parse("", null, null, null, [""], value = alloc(value), 0, [0], value));
}

function parse(value, root, parent, rule, rules, rulesets, pseudo, points, declarations) {
  var index = 0;
  var offset = 0;
  var length2 = pseudo;
  var atrule = 0;
  var property = 0;
  var previous = 0;
  var variable = 1;
  var scanning = 1;
  var ampersand = 1;
  var character2 = 0;
  var type = "";
  var props = rules;
  var children = rulesets;
  var reference = rule;
  var characters2 = type;
  while (scanning) {
    switch (previous = character2, character2 = next()) {
      case 40:
        if (previous !== 108 && charat(characters2, length2 - 1) === 58) {
          if (indexof(characters2 += replace(delimit(character2), "&", "&\f"), "&\f") !== -1) {
            ampersand = -1;
          }
          break;
        }
      case 34:
      case 39:
      case 91:
        characters2 += delimit(character2);
        break;
      case 9:
      case 10:
      case 13:
      case 32:
        characters2 += whitespace(previous);
        break;
      case 92:
        characters2 += escaping(caret() - 1, 7);
        continue;
      case 47:
        switch (peek()) {
          case 42:
          case 47:
            append(comment(commenter(next(), caret()), root, parent), declarations);
            break;
        }
        break;
      default:
        characters2 += from(character2);
    }
  }
  return declarations;
}function parseRuleset(value, root, parent, index, offset, rules, points, type, props, children, length2) {
  let post = offset - 1;
  let rule = "";

  // Initialize variables
  let characters2 = "";
  let scanning = 1;
  let ampersand = 1;
  let property = 0;
  let variable = 1;
  let atrule = 0;
  let pseudo = 0;
  let length = 0;

  // Loop through characters in the value
  for (let i = 0; i < value.length; i++) {
    let character2 = value.charCodeAt(i);

    switch (character2) {
      case 123: // '{'
        if (variable < 1) {
          --variable;
        } else {
          points[index++] = characters2.length * ampersand;
          characters2 = "";
        }
        break;

      case 125: // '}'
        if (variable++ === 0 && value.charCodeAt(i - 1) === 125) {
          continue;
        }
        break;

      case 59: // ';'
      case 0:
        switch (character2) {
          case 0:
          case 125:
            scanning = 0;
          case 59 + offset:
            if (ampersand === -1) {
              characters2 = characters2.replace(/\f/g, "");
            }
            if (property > 0 && characters2.length - length2) {
              append(
                property > 32
                  ? declaration(characters2 + ";", rule, parent, length2 - 1)
                  : declaration(characters2.replace(" ", "") + ";", rule, parent, length2 - 2),
                declarations
              );
            }
            break;
          case 59:
            characters2 += ";";
          default:
            append(
              (reference = ruleset(characters2, root, parent, index, offset, rules, points, type, props = [], children = [], length2)),
              rulesets
            );
            if (character2 === 123) {
              if (offset === 0) {
                parse(characters2, root, reference, reference, props, rulesets, length2, points, children);
              } else {
                switch (atrule === 99 && value.charCodeAt(3) === 110 ? 100 : atrule) {
                  case 100:
                  case 108:
                  case 109:
                  case 115:
                    parse(
                      value,
                      reference,
                      reference,
                      rule && append(ruleset(value, reference, reference, 0, 0, rules, points, type, rules, props = [], length2), children),
                      rules,
                      children,
                      length2,
                      points,
                      rule ? props : children
                    );
                    break;
                  default:
                    parse(characters2, reference, reference, reference, [""], children, 0, points, children);
                }
              }
            }
        }
        index = offset = property = 0;
        variable = ampersand = 1;
        type = characters2 = "";
        length2 = pseudo;
        break;

      case 58: // ':'
        length2 = 1 + characters2.length;
        property = previous;
        break;

      default:
        if (variable < 1) {
          if (character2 === 123) {
            --variable;
          } else if (character2 === 125 && variable++ === 0 && value.charCodeAt(i - 1) === 125) {
            continue;
          }
        }
        switch ((characters2 += String.fromCharCode(character2), character2 * variable)) {
          case 38: // '&'
            ampersand = offset > 0 ? 1 : (characters2 += "\f", -1);
            break;
          case 44: // ','
            points[index++] = (characters2.length - 1) * ampersand;
            ampersand = 1;
            break;
          case 64: // '@'
            if (value.charCodeAt(i + 1) === 45) {
              characters2 += delimit(value.charCodeAt(i + 1));
            }
            atrule = value.charCodeAt(i + 1);
            offset = length2 = (type = characters2 += identifier(value.charCodeAt(i + 1))).length;
            character2++;
            break;
          case 45: // '-'
            if (previous === 45 && characters2.length === 2) {
              variable = 0;
            }
        }
    }
  }
  return rulesets;
}offset === 0 ? rules : [""];
var size = Array.isArray(rule) ? rule.length : 0; // Ensure 'rule' is an array
for (var i = 0, j = 0, k = 0; i < index; ++i) {
  for (var x = 0, y = substr(value, post + 1, post = Math.abs(j = points[i])), z = value; x < size; ++x) {
    if (z = trim(j > 0 ? rule[x] + " " + y : replace(y, /&\f/g, rule[x]))) {
      props[k++] = z;
    }
  }
}
return node(value, root, parent, offset === 0 ? RULESET : type, props, children, length2);
}

function comment(value, root, parent) {
  return node(value, root, parent, COMMENT, from(char()), substr(value, 2, -2), 0);
}

function declaration(value, root, parent, length2) {
  return node(value, root, parent, DECLARATION, substr(value, 0, length2), substr(value, length2 + 1, -1), length2);
}

// node_modules/stylis/src/Serializer.js
function serialize(children, callback) {
  var output = "";
  var length2 = Array.isArray(children) ? children.length : 0; // Ensure 'children' is an array
  for (var i = 0; i < length2; i++) {
    output += callback(children[i], i, children, callback) || "";
  }
  return output;
}

function stringify(element, index, children, callback) {
  switch (element.type) {
    case LAYER:
      if (element.children.length) break;
    case IMPORT:
    case DECLARATION:
      return element.return = element.return || element.value;
    case COMMENT:
      return "";
    case KEYFRAMES:
      return element.return = element.value + "{" + serialize(element.children, callback) + "}";
    case RULESET:
      element.value = element.props.join(",");
  }
  return strlen(children = serialize(element.children, callback)) ? element.return = element.value + "{" + children + "}" : "";
}

// node_modules/stylis/src/Middleware.js
function middleware(collection) {
  var length2 = Array.isArray(collection) ? collection.length : 0; // Ensure 'collection' is an array
  return function(element, index, children, callback) {
    var output = "";
    for (var i = 0; i < length2; i++) {
      output += collection[i](element, index, children, callback) || "";
    }
    return output;
  };
}

// node_modules/@emotion/cache/dist/emotion-cache.browser.development.esm.js
var identifierWithPointTracking = function identifierWithPointTracking2(begin, points, index) {
  var previous = 0;
  var character2 = 0;
  while (true) {
    previous = character2;
    character2 = peek();
    if (previous === 38 && character2 === 12) {
      points[index] = 1;
    }
    if (token(character2)) {
      break;
    }
    next();
  }
  return slice(begin, position);
};

var toRules = function toRules2(parsed, points) {
  var index = -1;
  var character2 = 44;
  do {
    switch (token(character2)) {
      case 0:
        if (character2 === 38 && peek() === 12) {
          points[index] = 1;
        }
        parsed[index] += identifierWithPointTracking(position - 1, points, index);
        break;
      case 2:
        parsed[index] += delimit(character2);
        break;
      case 4:
        if (character2 === 44) {
          parsed[++index] = peek() === 58 ? "&\f" : "";
          points[index] = parsed[index].length;
          break;
        }
      default:
        parsed[index] += from(character2);
    }
  } while (character2 !== 0);
};} while (character2 = next());
  return parsed;
};

var getRules = function getRules2(value, points) {
  return dealloc(toRules(alloc(value), points));
};

var fixedElements = /* @__PURE__ */ new WeakMap();

var compat = function compat2(element) {
  if (element.type !== "rule" || !element.parent || element.length < 1) {
    return;
  }
  
  var value = element.value;
  var parent = element.parent;
  var isImplicitRule = element.column === parent.column && element.line === parent.line;
  
  while (parent.type !== "rule") {
    parent = parent.parent;
    if (!parent) return;
  }
  
  if (element.props.length === 1 && value.charCodeAt(0) !== 58 && !fixedElements.get(parent)) {
    return;
  }
  
  if (isImplicitRule) {
    return;
  }
  
  fixedElements.set(element, true);
  var points = [];
  var rules = getRules(value, points);
  var parentRules = parent.props;
  
  for (var i = 0, k = 0; i < rules.length; i++) {
    for (var j = 0; j < parentRules.length; j++, k++) {
      element.props[k] = points[i] ? rules[i].replace(/&\f/g, parentRules[j]) : parentRules[j] + " " + rules[i];
    }
  }
};

var removeLabel = function removeLabel2(element) {
  if (element.type === "decl") {
    var value = element.value;
    if (value.charCodeAt(0) === 108 && value.charCodeAt(2) === 98) {
      element["return"] = "";
      element.value = "";
    }
  }
};

var ignoreFlag = "emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-the-warning-exists-for-a-reason";

var isIgnoringComment = function isIgnoringComment2(element) {
  return element.type === "comm" && element.children.indexOf(ignoreFlag) > -1;
};

var createUnsafeSelectorsAlarm = function createUnsafeSelectorsAlarm2(cache) {
  return function(element, index, children) {
    if (element.type !== "rule" || cache.compat) return;
    
    var unsafePseudoClasses = element.value.match(/(:first|:nth|:nth-last)-child/g);
    if (unsafePseudoClasses) {
      var isNested = !!element.parent;
      var commentContainer = isNested ? element.parent.children : children;
      
      for (var i = commentContainer.length - 1; i >= 0; i--) {
        var node2 = commentContainer[i];
        if (node2.line < element.line) {
          break;
        }
        if (node2.column < element.column) {
          if (isIgnoringComment(node2)) {
            return;
          }
          break;
        }
      }
      
      unsafePseudoClasses.forEach(function(unsafePseudoClass) {
        console.error('The pseudo class "' + unsafePseudoClass + '" is potentially unsafe when doing server-side rendering. Try changing it to "' + unsafePseudoClass.split("-child")[0] + '-of-type".');
      });
    }
  };
};

var isImportRule = function isImportRule2(element) {
  return element.type.charCodeAt(0) === 64 && element.value.startsWith('@import');
};(1) === 105 && element.type.charCodeAt(0) === 64;
};

var isPrependedWithRegularRules = function isPrependedWithRegularRules2(index, children) {
  for (var i = index - 1; i >= 0; i--) {
    if (!isImportRule(children[i])) {
      return true;
    }
  }
  return false;
};

var nullifyElement = function nullifyElement2(element) {
  element.type = "";
  element.value = "";
  element["return"] = "";
  element.children = "";
  element.props = "";
};

var incorrectImportAlarm = function incorrectImportAlarm2(element, index, children) {
  if (!isImportRule(element)) {
    return;
  }
  if (element.parent) {
    console.error("`@import` rules can't be nested inside other rules. Please move it to the top level and put it before regular rules. Keep in mind that they can only be used within global styles.");
    nullifyElement(element);
  } else if (isPrependedWithRegularRules(index, children)) {
    console.error("`@import` rules can't be after other rules. Please put your `@import` rules before your other rules.");
    nullifyElement(element);
  }
};

function prefix2(value, length2) {
  switch (hash(value, length2)) {
    case 5103:
      return WEBKIT + "print-" + value + value;
    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921:
    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005:
    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855:
    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return WEBKIT + value + value;
    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return WEBKIT + value + MOZ + value + MS + value + value;
    case 6828:
    case 4268:
      return WEBKIT + value + MS + value + value;
    case 6165:
      return WEBKIT + value + MS + "flex-" + value + value;
    case 5187:
      return WEBKIT + value + replace(value, /(\w+).+(:[^]+)/, WEBKIT + "box-$1$2" + MS + "flex-$1$2") + value;
    case 5443:
      return WEBKIT + value + MS + "flex-item-" + replace(value, /flex-|-self/, "") + value;
    case 4675:
      return WEBKIT + value + MS + "flex-line-pack" + replace(value, /align-content|flex-|-self/, "") + value;
    case 5548:
      return WEBKIT + value + MS + replace(value, "shrink", "negative") + value;
    case 5292:
      return WEBKIT + value + MS + replace(value, "basis", "preferred-size") + value;
    case 6060:
      return WEBKIT + "box-" + replace(value, "-grow", "") + WEBKIT + value + MS + replace(value, "grow", "positive") + value;
    case 4554:
      return WEBKIT + replace(value, /([^-])(transform)/g, "$1" + WEBKIT + "$2") + value;
    case 6187:
      return replace(replace(replace(value, /(zoom-|grab)/, WEBKIT + "$1"), /(image-set)/, WEBKIT + "$1"), value, "") + value;
    case 5495:
    case 3959:
      return replace(value, /(image-set\([^]*)/, WEBKIT + "$1$`$1");
    case 4968:
      return replace(replace(value, /(.+:)(flex)/, WEBKIT + "$1$2"), value, "") + value;
    default:
      return value;
  }
}function prefix2(value, length2) {
  switch (hash(value, length2)) {
    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return replace(value, /(.+)-inline(.+)/, WEBKIT + "$1$2") + value;
    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      if (strlen(value) - 1 - length2 > 6) {
        switch (charat(value, length2 + 1)) {
          case 109:
            if (charat(value, length2 + 4) !== 45) break;
          case 102:
            return replace(value, /(.+:)(.+)-([^]+)/, "$1" + WEBKIT + "$2-$3$1" + MOZ + (charat(value, length2 + 3) == 108 ? "$3" : "$2-$3")) + value;
          case 115:
            return ~indexof(value, "stretch") ? prefix2(replace(value, "stretch", "fill-available"), length2) + value : value;
        }
      }
      break;
    case 4949:
      if (charat(value, length2 + 1) !== 115) break;
    case 6444:
      switch (charat(value, strlen(value) - 3 - (~indexof(value, "!important") && 10))) {
        case 107:
          return replace(value, ":", ":" + WEBKIT) + value;
        case 101:
          return replace(value, /(.+:)([^;!]+)(;|!.+)?/, "$1" + WEBKIT + (charat(value, 14) === 45 ? "inline-" : "") + "box$3$1" + WEBKIT + "$2$3$1" + MS + "$2box$3") + value;
      }
      break;
    case 5936:
      switch (charat(value, length2 + 11)) {
        case 114:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "tb") + value;
        case 108:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "tb-rl") + value;
        case 45:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "lr") + value;
      }
      return WEBKIT + value + MS + value + value;
  }
  return value;
}

var prefixer = function prefixer2(element, index, children, callback) {
  if (element.length > -1) {
    if (!element["return"]) {
      switch (element.type) {
        case DECLARATION:
          element["return"] = prefix2(element.value, element.length);
          break;
        case KEYFRAMES:
          return serialize([copy(element, {
            value: replace(element.value, "@", "@" + WEBKIT)
          })], callback);
        case RULESET:
          if (element.length) {
            return combine(element.props, function(value) {
              switch (match(value, /(::plac\w+|:read-\w+)/)) {
                case ":read-only":
                case ":read-write":
                  return serialize([copy(element, {
                    props: [replace(value, /:(read-\w+)/, ":" + MOZ + "$1")]
                  })], callback);
                case "::placeholder":
                  return serialize([copy(element, {
                    props: [replace(value, /:(plac\w+)/, ":" + WEBKIT + "input-$1")]
                  }), copy(element, {
                    props: [replace(value, /:(plac\w+)/, ":" + MOZ + "$1")]
                  })], callback);
              }
            });
          }
          break;
      }
    }
  }
  return element;
};OZ + "$1")]
                  }), copy(element, {
                    props: [replace(value, /:(plac\w+)/, MS + "input-$1")]
                  })], callback);
              }
              return "";
            });
      }
  }
};
var defaultStylisPlugins = [prefixer];
var getSourceMap;
{
  sourceMapPattern = /\/\*#\ssourceMappingURL=data:application\/json;\S+\s+\*\//g;
  getSourceMap = function getSourceMap2(styles) {
    var matches = styles.match(sourceMapPattern);
    if (!matches)
      return;
    return matches[matches.length - 1];
  };
}
var sourceMapPattern;
var createCache = function createCache2(options) {
  var key = options.key;
  if (!key) {
    throw new Error("You have to configure `key` for your cache. Please make sure it's unique (and not equal to 'css') as it's used for linking styles to your cache.\nIf multiple caches share the same key they might \"fight\" for each other's style elements.");
  }
  if (key === "css") {
    var ssrStyles = document.querySelectorAll("style[data-emotion]:not([data-s])");
    Array.prototype.forEach.call(ssrStyles, function(node2) {
      var dataEmotionAttribute = node2.getAttribute("data-emotion");
      if (dataEmotionAttribute.indexOf(" ") === -1) {
        return;
      }
      document.head.appendChild(node2);
      node2.setAttribute("data-s", "");
    });
  }
  var stylisPlugins = options.stylisPlugins || defaultStylisPlugins;
  {
    if (/[^a-z-]/.test(key)) {
      throw new Error('Emotion key must only contain lower case alphabetical characters and - but "' + key + '" was passed');
    }
  }
  var inserted = {};
  var container;
  var nodesToHydrate = [];
  {
    container = options.container || document.head;
    Array.prototype.forEach.call(
      // this means we will ignore elements which don't have a space in them which
      // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
      document.querySelectorAll('style[data-emotion^="' + key + ' "]'),
      function(node2) {
        var attrib = node2.getAttribute("data-emotion").split(" ");
        for (var i = 1; i < attrib.length; i++) {
          inserted[attrib[i]] = true;
        }
        nodesToHydrate.push(node2);
      }
    );
  }
  var _insert;
  var omnipresentPlugins = [compat, removeLabel];
  {
    omnipresentPlugins.push(createUnsafeSelectorsAlarm({
      get compat() {
        return cache.compat;
      }
    }), incorrectImportAlarm);
  }
  {
    var currentSheet;
    var finalizingPlugins = [stringify, function(element) {
      if (!element.root) {
        if (element["return"]) {
          currentSheet.insert(element["return"]);
        } else if (element.value && element.type !== COMMENT) {
          currentSheet.insert(element.value + "{}");
        }
      }
    }];
    var serializer = middleware(omnipresentPlugins.concat(stylisPlugins, finalizingPlugins));
    var stylis = function stylis2(styles) {
      return serialize(compile(styles), serializer);
    };
  }
}function insert(selector, serialized, sheet, shouldCache) {
  let currentSheet = sheet;
  if (getSourceMap) {
    const sourceMap = getSourceMap(serialized.styles);
    if (sourceMap) {
      currentSheet = {
        insert: function(rule) {
          sheet.insert(rule + sourceMap);
        }
      };
    }
  }
  stylis(selector ? `${selector}{${serialized.styles}}` : serialized.styles);
  if (shouldCache) {
    cache.inserted[serialized.name] = true;
  }
}

const cache = {
  key,
  sheet: new StyleSheet({
    key,
    container,
    nonce: options.nonce,
    speedy: options.speedy,
    prepend: options.prepend,
    insertionPoint: options.insertionPoint
  }),
  nonce: options.nonce,
  inserted,
  registered: {},
  insert
};

cache.sheet.hydrate(nodesToHydrate);
return cache;

// node_modules/@babel/runtime/helpers/esm/extends.js
function _extends() {
  return Object.assign ? Object.assign.bind() : function(target) {
    for (let i = 1; i < arguments.length; i++) {
      const source = arguments[i];
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
}

// node_modules/@emotion/weak-memoize/dist/emotion-weak-memoize.esm.js
const weakMemoize = function(func) {
  const cache = new WeakMap();
  return function(arg) {
    if (cache.has(arg)) {
      return cache.get(arg);
    }
    const result = func(arg);
    cache.set(arg, result);
    return result;
  };
};

// node_modules/@emotion/react/_isolated-hnrs/dist/emotion-react-_isolated-hnrs.browser.esm.js
import hoistNonReactStatics from 'hoist-non-react-statics';

const hoistStatics = function(targetComponent, sourceComponent) {
  return hoistNonReactStatics(targetComponent, sourceComponent);
};

// node_modules/@emotion/utils/dist/emotion-utils.browser.esm.js
const isBrowser = typeof window !== 'undefined';

function getRegisteredStyles(registered, registeredStyles, classNames) {
  let rawClassName = "";
  classNames.split(" ").forEach(function(className) {
    if (registered[className] !== undefined) {
      registeredStyles.push(`${registered[className]};`);
    } else if (className) {
      rawClassName += `${className} `;
    }
  });
  return rawClassName;
}

const registerStyles = function(cache, serialized, isStringTag) {
  const className = `${cache.key}-${serialized.name}`;
  if (!isStringTag || (isStringTag === false && isBrowser)) {
    cache.registered[className] = serialized.styles;
  }
};// Ensure that the code is properly formatted and any potential issues are addressed

// Function to register styles in the cache
var registerStyles = function(cache, serialized, isBrowser) {
  var className = cache.key + "-" + serialized.name;
  if (
    (isBrowser === false) && 
    (cache.registered[className] === undefined)
  ) {
    cache.registered[className] = serialized.styles;
  }
};

// Function to insert styles into the cache
var insertStyles = function(cache, serialized, isStringTag) {
  registerStyles(cache, serialized, isStringTag);
  var className = cache.key + "-" + serialized.name;
  if (cache.inserted[serialized.name] === undefined) {
    var current = serialized;
    do {
      cache.insert(
        serialized === current ? "." + className : "", 
        current, 
        cache.sheet, 
        true
      );
      current = current.next;
    } while (current !== undefined);
  }
};

// Function to hash strings using the Murmur2 algorithm
function murmur2(str) {
  var h = 0;
  var k, i = 0, len = str.length;
  for (; len >= 4; ++i, len -= 4) {
    k = str.charCodeAt(i) & 255 | 
        (str.charCodeAt(++i) & 255) << 8 | 
        (str.charCodeAt(++i) & 255) << 16 | 
        (str.charCodeAt(++i) & 255) << 24;
    k = (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16);
    k ^= k >>> 24;
    h = (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16) ^ 
        (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
  }
  switch (len) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 255) << 16;
    case 2:
      h ^= (str.charCodeAt(i + 1) & 255) << 8;
    case 1:
      h ^= str.charCodeAt(i) & 255;
      h = (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
  }
  h ^= h >>> 13;
  h = (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
  return ((h ^ h >>> 15) >>> 0).toString(36);
}

// Object containing unitless CSS properties
var unitlessKeys = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  scale: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
};

// Function to memoize results of a function
function memoize(fn) {
  var cache = Object.create(null);
  return function(arg) {
    if (cache[arg] === undefined) {
      cache[arg] = fn(arg);
    }
    return cache[arg];
  };
}// node_modules/@emotion/serialize/dist/emotion-serialize.development.esm.js
var isDevelopment2 = true;
var ILLEGAL_ESCAPE_SEQUENCE_ERROR = `You have illegal escape sequence in your template literal, most likely inside content's property value.
Because you write your CSS inside a JavaScript string you actually have to do double escaping, so for example "content: '\\00d7';" should become "content: '\\\\00d7';".
You can read more about this here:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#ES2018_revision_of_illegal_escape_sequences`;
var UNDEFINED_AS_OBJECT_KEY_ERROR = "You have passed in falsy value as style object's key (can happen when in example you pass unexported component as computed key).";
var hyphenateRegex = /[A-Z]|^ms/g;
var animationRegex = /_EMO_([^_]+?)_([^]*?)_EMO_/g;
var isCustomProperty = function isCustomProperty2(property) {
  return property.charCodeAt(1) === 45;
};
var isProcessableValue = function isProcessableValue2(value) {
  return value != null && typeof value !== "boolean";
};
var processStyleName = memoize(function(styleName) {
  return isCustomProperty(styleName) ? styleName : styleName.replace(hyphenateRegex, "-$&").toLowerCase();
});
var processStyleValue = function processStyleValue2(key, value) {
  switch (key) {
    case "animation":
    case "animationName": {
      if (typeof value === "string") {
        return value.replace(animationRegex, function(match2, p1, p2) {
          cursor = {
            name: p1,
            styles: p2,
            next: cursor
          };
          return p1;
        });
      }
    }
  }
  if (unitlessKeys[key] !== 1 && !isCustomProperty(key) && typeof value === "number" && value !== 0) {
    return value + "px";
  }
  return value;
};

var contentValuePattern = /(var|attr|counters?|url|element|(((repeating-)?(linear|radial))|conic)-gradient)\(|(no-)?(open|close)-quote/;
var contentValues = ["normal", "none", "initial", "inherit", "unset"];
var oldProcessStyleValue = processStyleValue;
var msPattern = /^-ms-/;
var hyphenPattern = /-(.)/g;
var hyphenatedCache = {};
processStyleValue = function processStyleValue3(key, value) {
  if (key === "content") {
    if (typeof value !== "string" || contentValues.indexOf(value) === -1 && !contentValuePattern.test(value) && (value.charAt(0) !== value.charAt(value.length - 1) || value.charAt(0) !== '"' && value.charAt(0) !== "'")) {
      throw new Error("You seem to be using a value for 'content' without quotes, try replacing it with `content: '\"" + value + "\"'`");
    }
  }
  var processed = oldProcessStyleValue(key, value);
  if (processed !== "" && !isCustomProperty(key) && key.indexOf("-") !== -1 && hyphenatedCache[key] === void 0) {
    hyphenatedCache[key] = true;
    console.error("Using kebab-case for css properties in objects is not supported. Did you mean " + key.replace(msPattern, "ms-").replace(hyphenPattern, function(str, _char) {
      return _char.toUpperCase();
    }) + "?");
  }
  return processed;
};var contentValuePattern;
var contentValues;
var oldProcessStyleValue;
var msPattern;
var hyphenPattern;
var hyphenatedCache;
var noComponentSelectorMessage = "Component selectors can only be used in conjunction with @emotion/babel-plugin, the swc Emotion plugin, or another Emotion-aware compiler transform.";

function handleInterpolation(mergedProps, registered, interpolation) {
  if (interpolation == null) {
    return "";
  }

  var componentSelector = interpolation;
  if (componentSelector.__emotion_styles !== void 0) {
    if (String(componentSelector) === "NO_COMPONENT_SELECTOR") {
      throw new Error(noComponentSelectorMessage);
    }
    return componentSelector;
  }

  switch (typeof interpolation) {
    case "boolean":
      return "";

    case "object":
      var keyframes = interpolation;
      if (keyframes.anim === 1) {
        cursor = {
          name: keyframes.name,
          styles: keyframes.styles,
          next: cursor
        };
        return keyframes.name;
      }

      var serializedStyles = interpolation;
      if (serializedStyles.styles !== void 0) {
        var next2 = serializedStyles.next;
        while (next2 !== void 0) {
          cursor = {
            name: next2.name,
            styles: next2.styles,
            next: cursor
          };
          next2 = next2.next;
        }
        var styles = serializedStyles.styles + ";";
        return styles;
      }
      return createStringFromObject(mergedProps, registered, interpolation);

    case "function":
      if (mergedProps !== void 0) {
        var previousCursor = cursor;
        var result = interpolation(mergedProps);
        cursor = previousCursor;
        return handleInterpolation(mergedProps, registered, result);
      } else {
        console.error("Functions that are interpolated in css calls will be stringified.\nIf you want to have a css call based on props, create a function that returns a css call like this\nlet dynamicStyle = (props) => css`color: ${props.color}`\nIt can be called directly with props or interpolated in a styled call like this\nlet SomeComponent = styled('div')`${dynamicStyle}`");
      }
      break;

    case "string":
      var matched = [];
      var replaced = interpolation.replace(animationRegex, function(_match, _p1, p2) {
        var fakeVarName = "animation" + matched.length;
        matched.push("const " + fakeVarName + " = keyframes`" + p2.replace(/^@keyframes animation-\w+/, "") + "`");
        return "${" + fakeVarName + "}";
      });
      if (matched.length) {
        console.error("`keyframes` output got interpolated into plain string, please wrap it with `css`.\n\nInstead of doing this:\n\n" + [].concat(matched, ["`" + replaced + "`"]).join("\n") + "\n\nYou should wrap it with `css` like this:\n\ncss`" + replaced + "`");
      }
      break;
  }
}var asString = interpolation;
if (registered == null) {
  return asString;
}
var cached = registered[asString];
return cached !== undefined ? cached : asString;
}

function createStringFromObject(mergedProps, registered, obj) {
  var string = "";
  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      string += handleInterpolation(mergedProps, registered, obj[i]) + ";";
    }
  } else {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) { // Ensure only own properties are processed
        var value = obj[key];
        if (typeof value !== "object") {
          var asString = value;
          if (registered != null && registered[asString] !== undefined) {
            string += key + "{" + registered[asString] + "}";
          } else if (isProcessableValue(asString)) {
            string += processStyleName(key) + ":" + processStyleValue(key, asString) + ";";
          }
        } else {
          if (key === "NO_COMPONENT_SELECTOR" && isDevelopment2) {
            throw new Error(noComponentSelectorMessage);
          }
          if (Array.isArray(value) && typeof value[0] === "string" && (registered == null || registered[value[0]] === undefined)) {
            for (var _i = 0; _i < value.length; _i++) {
              if (isProcessableValue(value[_i])) {
                string += processStyleName(key) + ":" + processStyleValue(key, value[_i]) + ";";
              }
            }
          } else {
            var interpolated = handleInterpolation(mergedProps, registered, value);
            switch (key) {
              case "animation":
              case "animationName": {
                string += processStyleName(key) + ":" + interpolated + ";";
                break;
              }
              default: {
                if (key === "undefined") {
                  console.error(UNDEFINED_AS_OBJECT_KEY_ERROR);
                }
                string += key + "{" + interpolated + "}";
              }
            }
          }
        }
      }
    }
  }
  return string;
}

var labelPattern = /label:\s*([^\s;{]+)\s*(;|$)/g;
var cursor;

function serializeStyles(args, registered, mergedProps) {
  if (args.length === 1 && typeof args[0] === "object" && args[0] !== null && args[0].styles !== undefined) {
    return args[0];
  }
  var stringMode = true;
  var styles = "";
  cursor = undefined;
  var strings = args[0];
  if (strings == null || strings.raw === undefined) {
    stringMode = false;
    styles += handleInterpolation(mergedProps, registered, strings);
  } else {
    var asTemplateStringsArr = strings;
    if (asTemplateStringsArr[0] === undefined) {
      console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
    }
    styles += asTemplateStringsArr[0];
  }
  for (var i = 1; i < args.length; i++) {
    styles += handleInterpolation(mergedProps, registered, args[i]);
    if (stringMode) {
      var templateStringsArr = strings;
      if (templateStringsArr[i] === undefined) {
        console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
      }
      styles += templateStringsArr[i];
    }
  }
  labelPattern.lastIndex = 0;
  var identifierName = "";
  var match2;
  while ((match2 = labelPattern.exec(styles)) !== null) {
    identifierName += "-" + match2[1];
  }
  return {
    name: identifierName,
    styles: styles,
    map: cursor
  };
}// Improved Code

// Import necessary modules
var React = require('react');
var React2 = require('react');
var import_react = require('react');

// Function to generate a unique name for styles
function generateStyleName(styles) {
  var identifierName = '';
  var match2;
  while ((match2 = /regexPattern/.exec(styles)) !== null) {
    identifierName += "-" + match2[1];
  }
  return murmur2(styles) + identifierName;
}

// Function to create development styles
function createDevStyles(styles, cursor) {
  var name = generateStyleName(styles);
  return {
    name,
    styles,
    next: cursor,
    toString: function toString() {
      return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop).";
    }
  };
}

// Use Insertion Effect with Fallbacks
var syncFallback = function syncFallback2(create) {
  return create();
};
var useInsertionEffect2 = React.useInsertionEffect ? React.useInsertionEffect : false;
var useInsertionEffectAlwaysWithSyncFallback = useInsertionEffect2 || syncFallback;
var useInsertionEffectWithLayoutFallback = useInsertionEffect2 || React.useLayoutEffect;

// Emotion Element
var isBrowser2 = typeof window !== 'undefined';
var hasOwnProperty = {}.hasOwnProperty;

// Emotion Cache Context
var EmotionCacheContext = React2.createContext(
  typeof HTMLElement !== "undefined" ? createCache({ key: "css" }) : null
);

if (process.env.NODE_ENV !== 'production') {
  EmotionCacheContext.displayName = "EmotionCacheContext";
}

var CacheProvider = EmotionCacheContext.Provider;

// Unsafe use Emotion Cache
var __unsafe_useEmotionCache = function useEmotionCache() {
  return import_react.useContext(EmotionCacheContext);
};

// With Emotion Cache
var withEmotionCache = function withEmotionCache2(func) {
  return import_react.forwardRef(function(props, ref) {
    var cache = import_react.useContext(EmotionCacheContext);
    return func(props, cache, ref);
  });
};

if (!isBrowser2) {
  withEmotionCache = function withEmotionCache3(func) {
    return function(props) {
      var cache = import_react.useContext(EmotionCacheContext);
      if (cache === null) {
        cache = createCache({ key: "css" });
        return React2.createElement(EmotionCacheContext.Provider, { value: cache }, func(props, cache));
      } else {
        return func(props, cache);
      }
    };
  };
}

// Theme Context
var ThemeContext = React2.createContext({});

if (process.env.NODE_ENV !== 'production') {
  ThemeContext.displayName = "EmotionThemeContext";
}

// Use Theme
var useTheme = function useTheme2() {
  return React2.useContext(ThemeContext);
};

// Get Theme
var getTheme = function getTheme2(outerTheme, theme) {
  if (typeof theme === "function") {
    return theme(outerTheme);
  }
  return { ...outerTheme, ...theme };
};var mergedTheme = theme(outerTheme);
if (mergedTheme == null || typeof mergedTheme !== "object" || Array.isArray(mergedTheme)) {
  throw new Error("[ThemeProvider] Please return an object from your theme function, i.e. theme={() => ({})}!");
}
return mergedTheme;
}

if (theme == null || typeof theme !== "object" || Array.isArray(theme)) {
  throw new Error("[ThemeProvider] Please make your theme prop a plain object");
}

return _extends({}, outerTheme, theme);
};

var createCacheWithTheme = weakMemoize(function(outerTheme) {
  return weakMemoize(function(theme) {
    return getTheme(outerTheme, theme);
  });
});

var ThemeProvider = function ThemeProvider2(props) {
  var theme = React2.useContext(ThemeContext);
  if (props.theme !== theme) {
    theme = createCacheWithTheme(theme)(props.theme);
  }
  return React2.createElement(ThemeContext.Provider, {
    value: theme
  }, props.children);
};

function withTheme(Component) {
  var componentName = Component.displayName || Component.name || "Component";
  var render = function render2(props, ref) {
    var theme = React2.useContext(ThemeContext);
    return React2.createElement(Component, _extends({
      theme,
      ref
    }, props));
  };
  var WithTheme = React2.forwardRef(render);
  WithTheme.displayName = "WithTheme(" + componentName + ")";
  return hoistNonReactStatics(WithTheme, Component);
}

var getLastPart = function getLastPart2(functionName) {
  var parts = functionName.split(".");
  return parts[parts.length - 1];
};

var getFunctionNameFromStackTraceLine = function getFunctionNameFromStackTraceLine2(line2) {
  var match2 = /^\s+at\s+([A-Za-z0-9$.]+)\s/.exec(line2);
  if (match2) return getLastPart(match2[1]);
  match2 = /^([A-Za-z0-9$.]+)@/.exec(line2);
  if (match2) return getLastPart(match2[1]);
  return undefined;
};

var internalReactFunctionNames = /* @__PURE__ */ new Set(["renderWithHooks", "processChild", "finishClassComponent", "renderToString"]);

var sanitizeIdentifier = function sanitizeIdentifier2(identifier2) {
  return identifier2.replace(/\$/g, "-");
};

var getLabelFromStackTrace = function getLabelFromStackTrace2(stackTrace) {
  if (!stackTrace) return undefined;
  var lines = stackTrace.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var functionName = getFunctionNameFromStackTraceLine(lines[i]);
    if (!functionName) continue;
    if (internalReactFunctionNames.has(functionName)) break;
    if (/^[A-Z]/.test(functionName)) return sanitizeIdentifier(functionName);
  }
  return undefined;
};

var typePropName = "__EMOTION_TYPE_PLEASE_DO_NOT_USE__";
var labelPropName = "__EMOTION_LABEL_PLEASE_DO_NOT_USE__";

var createEmotionProps = function createEmotionProps2(type, props) {
  if (typeof props.css === "string" && props.css.indexOf(":") !== -1) {
    throw new Error("Strings are not allowed as css prop values, please wrap it in a css template literal from '@emotion/react' like css`...`");
  }
  return _extends({}, props, {
    [typePropName]: type,
    [labelPropName]: getLabelFromStackTrace(new Error().stack)
  });
};// Import necessary modules and functions
import React from 'react';
import {
  getRegisteredStyles,
  registerStyles,
  insertStyles,
  serializeStyles,
  useInsertionEffectAlwaysWithSyncFallback,
  withEmotionCache,
  ThemeContext
} from 'emotion'; // Assuming these are from the 'emotion' library

// Utility function to get label from stack trace
function getLabelFromStackTrace(stack) {
  // Implement logic to extract label from stack trace
  return 'label'; // Placeholder return value
}

// Main Emotion component
const Emotion = withEmotionCache(function(props, cache, ref) {
  let cssProp = props.css;
  if (typeof cssProp === "string" && cache.registered[cssProp] !== undefined) {
    cssProp = cache.registered[cssProp];
  }
  const WrappedComponent = props[typePropName];
  const registeredStyles = [cssProp];
  let className = "";

  if (typeof props.className === "string") {
    className = getRegisteredStyles(cache.registered, registeredStyles, props.className);
  } else if (props.className != null) {
    className = props.className + " ";
  }

  let serialized = serializeStyles(registeredStyles, undefined, React.useContext(ThemeContext));
  if (serialized.name.indexOf("-") === -1) {
    const labelFromStack = props[labelPropName];
    if (labelFromStack) {
      serialized = serializeStyles([serialized, "label:" + labelFromStack + ";"]);
    }
  }
  className += cache.key + "-" + serialized.name;

  const newProps = {};
  for (const key in props) {
    if (hasOwnProperty.call(props, key) && key !== "css" && key !== typePropName && key !== labelPropName) {
      newProps[key] = props[key];
    }
  }
  newProps.ref = ref;
  newProps.className = className;

  return (
    <React.Fragment>
      <Insertion cache={cache} serialized={serialized} isStringTag={typeof WrappedComponent === "string"} />
      <WrappedComponent {...newProps} />
    </React.Fragment>
  );
});

if (process.env.NODE_ENV !== 'production') {
  Emotion.displayName = "EmotionCssPropInternal";
}

// Insertion component
const Insertion = function Insertion2({ cache, serialized, isStringTag }) {
  registerStyles(cache, serialized, isStringTag);
  useInsertionEffectAlwaysWithSyncFallback(() => insertStyles(cache, serialized, isStringTag));
  return null;
};

// Export the Emotion component
export {
  Emotion as Emotion$1
};