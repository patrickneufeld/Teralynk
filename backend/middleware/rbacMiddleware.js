const { hasPermission, getRole } = require('../services/rbacService');
const { logAuditEvent } = require('../services/auditLogService');

// **Middleware to enforce Role-Based Access Control (RBAC)**
const rbacMiddleware = (requiredPermissions = [], allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // **Step 1: Extract user details from the request (set by authMiddleware)**
      const userId = req.userId;  
      const userRole = req.role;  

      if (!userId || !userRole) {
        logAuditEvent('MISSING_USER_DATA', { userId: null, route: req.originalUrl });
        return res.status(401).json({ error: 'Unauthorized: User ID or role missing.' });
      }

      // **Step 2: Automatically allow admins if applicable**
      if (userRole.toLowerCase() === 'admin') {
        console.log(`Admin access granted for user: ${userId}`);
        return next();
      }

      // **Step 3: Check if the user role is one of the allowed roles**
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        logAuditEvent('ACCESS_DENIED', { userId, role: userRole, route: req.originalUrl });
        return res.status(403).json({ 
          error: `Access Denied: Role '${userRole}' is not allowed to access this route.`
        });
      }

      // **Step 4: Ensure the requiredPermissions is always an array**
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

      // **Step 5: Check if the user has all the required permissions**
      const permissionResults = await Promise.all(
        permissions.map((permission) => hasPermission(userId, permission))
      );

      const missingPermissions = permissions.filter((_, index) => !permissionResults[index]);

      if (missingPermissions.length > 0) {
        logAuditEvent('ACCESS_DENIED', { 
          userId, 
          role: userRole, 
          route: req.originalUrl, 
          missingPermissions 
        });
        
        return res.status(403).json({ 
          error: `Access Denied: Missing required permissions: ${missingPermissions.join(', ')}`
        });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('RBAC Error:', error);
      next(error); // Pass to global error handler
    }
  };
};

module.exports = rbacMiddleware;
