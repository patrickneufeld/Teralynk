// ✅ FILE: /frontend/src/hooks/useSession.js

import { useState, useEffect, useCallback } from 'react';
import { getClientId, getSessionId, getSessionDuration, getTimeSinceLastActivity, updateLastActivity } from '@/utils/authUtils';

/**
 * Hook: useSession
 * 
 * Provides real-time access to session metadata:
 * - clientId
 * - sessionId
 * - sessionDuration
 * - timeSinceLastActivity
 * 
 * Also provides a manual method to refresh activity.
 *
 * @returns {{
 *   clientId: string,
 *   sessionId: string,
 *   sessionDuration: number,
 *   lastActivitySeconds: number,
 *   refreshLastActivity: () => void
 * }}
 */
const useSession = () => {
  const [clientId, setClientId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [lastActivitySeconds, setLastActivitySeconds] = useState(0);

  const refreshLastActivity = useCallback(() => {
    updateLastActivity();
    setLastActivitySeconds(0);
  }, []);

  useEffect(() => {
    setClientId(getClientId());
    setSessionId(getSessionId());
    setSessionDuration(getSessionDuration());
    setLastActivitySeconds(getTimeSinceLastActivity());

    const interval = setInterval(() => {
      setSessionDuration(getSessionDuration());
      setLastActivitySeconds(getTimeSinceLastActivity());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    clientId,
    sessionId,
    sessionDuration,
    lastActivitySeconds,
    refreshLastActivity,
  };
};

export default useSession;
