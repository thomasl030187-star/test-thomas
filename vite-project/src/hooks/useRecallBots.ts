import { useCallback, useEffect, useState } from 'react';
import { RecallBotTracker } from '@/lib/types';
import { apiClient } from '@/lib/api';

interface SchedulePayload {
  id: string;
  title: string;
  meetingLink: string;
  startTime: string;
  accountEmail: string;
}

type AssignmentRecord = Record<string, RecallBotTracker>;

function mapAssignments(records: RecallBotTracker[]): AssignmentRecord {
  return records.reduce<AssignmentRecord>((acc, record) => {
    acc[record.eventId] = record;
    return acc;
  }, {});
}

export function useRecallBots() {
  const [assignments, setAssignments] = useState<AssignmentRecord>({});
  const [pendingEvents, setPendingEvents] = useState<Record<string, boolean>>({});
  const [refreshingEvents, setRefreshingEvents] = useState<Record<string, boolean>>({});
  const [failures, setFailures] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    apiClient.recallBots
      .list()
      .then((records) => {
        if (!isMounted) {
          return;
        }
        setAssignments(mapAssignments(records));
      })
      .catch((error) => {
        console.error('Failed to load Recall bots', error);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const clearFailure = useCallback((eventId: string) => {
    setFailures((prev) => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
  }, []);

  const scheduleBot = useCallback(
    async (payload: SchedulePayload, joinOffsetMinutes: number) => {
      if (!payload.meetingLink) {
        setFailures((prev) => ({
          ...prev,
          [payload.id]: 'Zoom meeting link missing.'
        }));
        return;
      }

      if (assignments[payload.id] || pendingEvents[payload.id]) {
        return;
      }

      const startTime = new Date(payload.startTime);
      const joinAtDate = new Date(startTime.getTime() - joinOffsetMinutes * 60_000);
      const joinAtISO = joinAtDate > new Date() ? joinAtDate.toISOString() : undefined;

      setPendingEvents((prev) => ({ ...prev, [payload.id]: true }));

      try {
        const tracker = await apiClient.recallBots.schedule({
          eventId: payload.id,
          meetingUrl: payload.meetingLink,
          meetingStartTime: payload.startTime,
          accountEmail: payload.accountEmail,
          title: payload.title,
          joinAt: joinAtISO
        });

        setAssignments((prev) => ({
          ...prev,
          [payload.id]: tracker
        }));

        setFailures((prev) => {
          const next = { ...prev };
          delete next[payload.id];
          return next;
        });
      } catch (error) {
        console.error(error);
        setFailures((prev) => ({
          ...prev,
          [payload.id]: error instanceof Error ? error.message : 'Failed to schedule Recall bot.'
        }));
      } finally {
        setPendingEvents((prev) => {
          const next = { ...prev };
          delete next[payload.id];
          return next;
        });
      }
    },
    [assignments, pendingEvents]
  );

  const refreshBot = useCallback(
    async (eventId: string) => {
      if (refreshingEvents[eventId]) {
        return;
      }

      const assignment = assignments[eventId];
      if (!assignment) {
        return;
      }

      setRefreshingEvents((prev) => ({ ...prev, [eventId]: true }));

      try {
        const updatedRecord = await apiClient.recallBots.get(assignment.botId);
        setAssignments((prev) => ({
          ...prev,
          [eventId]: updatedRecord
        }));
      } catch (error) {
        setFailures((prev) => ({
          ...prev,
          [eventId]: error instanceof Error ? error.message : 'Unable to refresh Recall bot.'
        }));
      } finally {
        setRefreshingEvents((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
      }
    },
    [assignments, refreshingEvents]
  );

  const removeAssignment = useCallback(
    async (eventId: string) => {
      const assignment = assignments[eventId];
      if (!assignment) {
        return;
      }

      try {
        await apiClient.recallBots.delete(assignment.botId);
        setAssignments((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
        clearFailure(eventId);
      } catch (error) {
        console.error(error);
        setFailures((prev) => ({
          ...prev,
          [eventId]: 'Unable to delete Recall bot.'
        }));
      }
    },
    [assignments, clearFailure]
  );

  const isScheduling = useCallback((eventId: string) => Boolean(pendingEvents[eventId]), [pendingEvents]);
  const isRefreshing = useCallback((eventId: string) => Boolean(refreshingEvents[eventId]), [refreshingEvents]);

  return {
    assignments,
    scheduleBot,
    refreshBot,
    removeAssignment,
    failures,
    clearFailure,
    isScheduling,
    isRefreshing
  };
}
