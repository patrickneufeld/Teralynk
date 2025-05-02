import "./chunk-3EJPJMEH.js";

// node_modules/clsx/dist/clsx.mjs

/**
 * Recursively processes the input to generate a string of class names.
 * @param {any} e - The input to process, can be a string, number, array, or object.
 * @returns {string} - A string of class names.
 */
function r(e) {
  var t, f, n = "";
  if (typeof e === "string" || typeof e === "number") {
    n += e;
  } else if (typeof e === "object") {
    if (Array.isArray(e)) {
      for (t = 0; t < e.length; t++) {
        if (e[t]) {
          f = r(e[t]);
          if (f) {
            if (n) n += " ";
            n += f;
          }
        }
      }
    } else {
      for (t in e) {
        if (e[t]) {
          if (n) n += " ";
          n += t;
        }
      }
    }
  }
  return n;
}

/**
 * Combines class names based on the arguments provided.
 * @returns {string} - A combined string of class names.
 */
function clsx() {
  var e, t, f = 0, n = "";
  while (f < arguments.length) {
    e = arguments[f++];
    if (e) {
      t = r(e);
      if (t) {
        if (n) n += " ";
        n += t;
      }
    }
  }
  return n;
}

var clsx_default = clsx;
export {
  clsx,
  clsx_default as default
};
//# sourceMappingURL=clsx.js.map