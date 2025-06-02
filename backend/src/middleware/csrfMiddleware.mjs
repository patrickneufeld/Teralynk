// FILE: backend/src/middleware/csrfMiddleware.js

import csurf from "csurf";

/**
 * ✅ CSRF protection middleware using cookies
 * Should be used on routes requiring CSRF protection.
 */
const csrfProtection = csurf({ cookie: true });

export default csrfProtection;
