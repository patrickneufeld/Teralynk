// ✅ FILE: /frontend/src/routes/guards/RequireAuth.jsx

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logWarn, logError, logInfo, logDebug } from '../../utils/logging/logging';
import Loader from '../../components/ui/Loader';
import { ROUTES } from '../../constants/routes';
import { PERMISSION_LEVELS, AUTH_STATUS } from '@/constants/auth';
import { sanitizePath } from '../../utils/security/pathSanitizer';
import { useAnalytics } from '../../hooks/useAnalytics';

const SecurityHeaders = () => (
  <React.Fragment>
    <meta httpEquiv="Content-Security-Policy" content={'default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\' fonts.googleapis.com; img-src \'self\' data: blob: https:; font-src \'self\' fonts.gstatic.com; connect-src \'self\' https: wss:; frame-src \'self\''} />
    <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
    <meta httpEquiv="X-Frame-Options" content="DENY" />
    <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
    <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
    <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
    <meta httpEquiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=()" />
  </React.Fragment>
);

const RequireAuth = ({
  children,
  redirectPath = ROUTES.LOGIN,
  requiredPermissions = [],
  strictMode = false,
  minimumAuthLevel = PERMISSION_LEVELS.BASIC,
  allowImpersonation = false,
  onUnauthorized,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  const { 
    user, 
    status, 
    loading, 
    authLevel, 
    isImpersonating,
    sessionExpiry,
    refreshToken,
    lastActivity
  } = useAuth();

  const warnedRef = useRef(false);
  const redirectedRef = useRef(false);
  const authCheckTimeoutRef = useRef(null);
  const mountTimeRef = useRef(Date.now());

  const sanitizedRedirect = useMemo(() => {
    try {
      return sanitizePath(redirectPath) || ROUTES.LOGIN;
    } catch (error) {
      logError('Invalid redirect path', { error, redirectPath });
      return ROUTES.LOGIN;
    }
  }, [redirectPath]);

  const userPermissions = useMemo(() => {
    return new Set(user?.permissions || []);
  }, [user?.permissions]);

  const isAuthenticating = loading || status === AUTH_STATUS.CHECKING;
  const isAuthenticated = !!user && status === AUTH_STATUS.AUTHENTICATED;
  
  const hasValidSession = useCallback(() => {
    if (!sessionExpiry) return false;
    const buffer = strictMode ? 60000 : 0; // 1 minute buffer in strict mode
    return new Date(sessionExpiry).getTime() > Date.now() + buffer;
  }, [sessionExpiry, strictMode]);

  const hasRequiredPermissions = useMemo(() => {
    if (!requiredPermissions.length) return true;
    return requiredPermissions.every(perm => userPermissions.has(perm));
  }, [requiredPermissions, userPermissions]);

  const hasRequiredAuthLevel = useMemo(() => {
    return (authLevel || 0) >= minimumAuthLevel;
  }, [authLevel, minimumAuthLevel]);

  const isImpersonationAllowed = useMemo(() => {
    return allowImpersonation || !isImpersonating;
  }, [allowImpersonation, isImpersonating]);
  const handleSecurityError = useCallback((error, code) => {
    logError('Security check failed', { error, code });
    onUnauthorized?.({
      code,
      message: error.message,
      path: location.pathname
    });
    
    navigate(sanitizedRedirect, {
      replace: true,
      state: { 
        from: location.pathname,
        error: code,
        timestamp: Date.now()
      }
    });
  }, [location.pathname, navigate, sanitizedRedirect, onUnauthorized]);

  useEffect(() => {
    if (
      !isAuthenticating &&
      isAuthenticated &&
      hasValidSession() &&
      hasRequiredPermissions &&
      hasRequiredAuthLevel &&
      isImpersonationAllowed &&
      !redirectedRef.current
    ) {
      logInfo('✅ Access granted', {
        path: location.pathname,
        userId: user?.id,
        permissions: Array.from(userPermissions),
        authLevel,
      });
    }
  }, [
    isAuthenticating,
    isAuthenticated,
    hasRequiredPermissions,
    hasRequiredAuthLevel,
    isImpersonationAllowed,
    location.pathname,
    user?.id,
    userPermissions,
    authLevel,
    hasValidSession
  ]);

  useEffect(() => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      path: location.pathname,
      userId: user?.id,
      status,
      requiredPermissions,
      hasPermissions: hasRequiredPermissions,
      authLevel,
      minimumAuthLevel,
      isImpersonating,
      mountTime: mountTimeRef.current,
    };

    logInfo('🔐 Auth Check Audit Log', auditLog);
    trackEvent('auth_check', auditLog);

    return () => {
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
    };
  }, [location.pathname, user?.id, status, hasRequiredPermissions, authLevel, trackEvent]);

  useEffect(() => {
    const validateAndRedirect = () => {
      if (isAuthenticating || redirectedRef.current) return;

      try {
        const securityChecks = [
          { 
            condition: !isAuthenticated,
            message: 'User not authenticated',
            code: 'UNAUTHENTICATED'
          },
          {
            condition: !hasValidSession(),
            message: 'Invalid or expired session',
            code: 'INVALID_SESSION'
          },
          {
            condition: !hasRequiredPermissions,
            message: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS'
          },
          {
            condition: !hasRequiredAuthLevel,
            message: 'Insufficient auth level',
            code: 'INSUFFICIENT_AUTH_LEVEL'
          },
          {
            condition: !isImpersonationAllowed,
            message: 'Impersonation not allowed',
            code: 'IMPERSONATION_BLOCKED'
          }
        ];

        const failedCheck = securityChecks.find(check => check.condition);

        if (failedCheck) {
          if (!warnedRef.current) {
            logWarn(`🚫 Access denied: ${failedCheck.message}`, {
              path: location.pathname,
              code: failedCheck.code,
              userId: user?.id,
              requiredPermissions,
              userPermissions: Array.from(userPermissions),
              authLevel,
              minimumAuthLevel
            });
            warnedRef.current = true;
          }

          handleSecurityError(
            new Error(failedCheck.message),
            failedCheck.code
          );
          redirectedRef.current = true;
          return;
        }

        if (strictMode) {
          if (Date.now() - lastActivity > 3600000) {
            handleSecurityError(
              new Error('Security token requires refresh'),
              'TOKEN_REFRESH_REQUIRED'
            );
            return;
          }

          if (Date.now() - mountTimeRef.current < 1000) {
            handleSecurityError(
              new Error('Too many auth checks'),
              'RATE_LIMIT_EXCEEDED'
            );
            return;
          }
        }

      } catch (error) {
        handleSecurityError(error, 'SECURITY_CHECK_FAILED');
      }
    };

    authCheckTimeoutRef.current = setTimeout(validateAndRedirect, 100);

    return () => {
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
    };
  }, [
    isAuthenticating,
    isAuthenticated,
    hasRequiredPermissions,
    hasRequiredAuthLevel,
    isImpersonationAllowed,
    location.pathname,
    user?.id,
    strictMode,
    lastActivity,
    handleSecurityError
  ]);

  if (isAuthenticating) {
    logDebug('Auth verification in progress');
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="auth-loader">
        <Loader size="lg" />
        <div className="ml-3 text-gray-600">Verifying authentication...</div>
      </div>
    );
  }

  if (!redirectedRef.current) {
    logDebug('✅ Security checks passed, rendering protected content');
    return (
      <React.Fragment>
        {strictMode && <SecurityHeaders />}
        {children}
      </React.Fragment>
    );
  }

  return null;
};

RequireAuth.propTypes = {
  children: PropTypes.node.isRequired,
  redirectPath: PropTypes.string,
  requiredPermissions: PropTypes.arrayOf(PropTypes.string),
  strictMode: PropTypes.bool,
  minimumAuthLevel: PropTypes.number,
  allowImpersonation: PropTypes.bool,
  onUnauthorized: PropTypes.func,
};

RequireAuth.displayName = 'RequireAuth';

export default React.memo(RequireAuth);
