// ✅ FILE: /frontend/src/components/SecurityConsole.jsx

import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { securityEvents, SECURITY_EVENTS } from '../utils/security/eventEmitter';
import { formatDistanceToNowStrict } from 'date-fns';
import classNames from 'classnames';

const severityClasses = {
  info: 'bg-blue-100 text-blue-800',
  warn: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
};

const SecurityConsole = ({ maxItems = 100 }) => {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    severity: 'all',
    traceId: '',
    eventType: '',
    since: null
  });

  useEffect(() => {
    const handler = (event) => {
      setEvents((prev) => {
        const updated = [event, ...prev].slice(0, maxItems);
        return updated;
      });
    };

    Object.values(SECURITY_EVENTS).forEach(eventName => {
      securityEvents.on(eventName, handler);
    });

    return () => {
      Object.values(SECURITY_EVENTS).forEach(eventName => {
        securityEvents.off(eventName, handler);
      });
    };
  }, [maxItems]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSeverity =
        filters.severity === 'all' || filters.severity === event.severity;

      const matchesTraceId =
        !filters.traceId || event.traceId?.includes(filters.traceId);

      const matchesType =
        !filters.eventType || event.type === filters.eventType;

      const matchesSince =
        !filters.since || new Date(event.timestamp) >= new Date(filters.since);

      return matchesSeverity && matchesTraceId && matchesType && matchesSince;
    });
  }, [events, filters]);

  return (
    <div className="p-4 space-y-4 bg-white shadow rounded-md border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800">🔐 Security Console</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center text-sm text-gray-700">
        <label>
          Severity:
          <select
            className="ml-2 border rounded px-2 py-1"
            value={filters.severity}
            onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </label>

        <label>
          Event Type:
          <input
            type="text"
            placeholder="e.g. security:auth:failure"
            className="ml-2 border rounded px-2 py-1 w-64"
            value={filters.eventType}
            onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value }))}
          />
        </label>

        <label>
          Trace ID:
          <input
            type="text"
            placeholder="Search by traceId"
            className="ml-2 border rounded px-2 py-1 w-64"
            value={filters.traceId}
            onChange={(e) => setFilters((f) => ({ ...f, traceId: e.target.value }))}
          />
        </label>

        <label>
          Since:
          <input
            type="datetime-local"
            className="ml-2 border rounded px-2 py-1"
            onChange={(e) => setFilters((f) => ({ ...f, since: e.target.value || null }))}
          />
        </label>
      </div>

      {/* Console Log */}
      <div className="max-h-[600px] overflow-y-auto mt-4 border-t border-gray-200 pt-4 space-y-2 text-sm">
        {filteredEvents.length === 0 ? (
          <div className="text-gray-500">No matching security events found.</div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.eventId}
              className={classNames(
                'p-3 rounded shadow-sm border border-gray-200',
                severityClasses[event.severity || 'info']
              )}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-gray-500">
                  #{event.sequence} • {event.type}
                </span>
                <span className="text-xs text-gray-600">
                  {formatDistanceToNowStrict(new Date(event.timestamp), { addSuffix: true })}
                </span>
              </div>
              <div className="mt-1 text-sm font-medium">{event.data?.message || 'No message'}</div>
              <div className="text-xs text-gray-600 mt-1">
                Trace ID: {event.traceId} • Event ID: {event.eventId}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

SecurityConsole.propTypes = {
  maxItems: PropTypes.number,
};

export default SecurityConsole;
