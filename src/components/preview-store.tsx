'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createPreviewSeed,
  hasPreviewVisitConflict,
  isPreviewState,
  previewLeadStatusLabel,
  previewVisitStatusLabel,
} from '@/lib/preview-data';
import type { LeadSource, LeadStatus, VisitStatus } from '@/types';
import {
  PREVIEW_SCHEMA_VERSION,
  PREVIEW_STORAGE_KEY,
  type PreviewAgent,
  type PreviewLead,
  type PreviewNeighborhood,
  type PreviewProfile,
  type PreviewProperty,
  type PreviewState,
  type PreviewTimeSlot,
  type PreviewVisit,
} from '@/types/preview';

interface NewLeadInput {
  propertyId: string;
  message: string;
  source?: LeadSource;
}

interface NewVisitInput {
  propertyId: string;
  date: string;
  timeSlot: PreviewTimeSlot;
  visitType: 'IN_PERSON' | 'PRIVATE_VIDEO_TOUR';
}

interface VisitResult {
  ok: boolean;
  message: string;
}

interface PreviewContextValue {
  state: PreviewState;
  ready: boolean;
  reset: () => void;
  toggleSaved: (propertyId: string) => void;
  addLead: (input: NewLeadInput) => boolean;
  updateLeadStatus: (leadId: string, status: LeadStatus) => void;
  addLeadNote: (leadId: string, note: string) => void;
  addVisit: (input: NewVisitInput) => VisitResult;
  updateVisit: (
    visitId: string,
    input: { date: string; timeSlot: PreviewTimeSlot; status?: VisitStatus }
  ) => VisitResult;
  setVisitStatus: (visitId: string, status: VisitStatus) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  updateProfile: (profile: PreviewProfile) => void;
  saveProperty: (
    property: Omit<PreviewProperty, 'createdAt' | 'updatedAt'>
  ) => string;
  deleteProperty: (propertyId: string) => void;
  movePropertyMedia: (
    propertyId: string,
    mediaId: string,
    direction: -1 | 1
  ) => void;
  saveAgent: (agent: Omit<PreviewAgent, 'createdAt'>) => string;
  saveNeighborhood: (neighborhood: PreviewNeighborhood) => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function withActivity(
  state: PreviewState,
  label: string,
  detail: string,
  createdAt: string
): PreviewState {
  return {
    ...state,
    activity: [
      { id: makeId('activity'), label, detail, createdAt },
      ...state.activity,
    ].slice(0, 18),
  };
}

function customerLeadStatus(status: LeadStatus) {
  if (status === 'NEW') return 'Enquiry received';
  if (status === 'CONTACTED') return 'An advisor has made contact';
  if (status === 'QUALIFIED') return 'Advisor reviewing your brief';
  if (status === 'VISIT_SCHEDULED') return 'Visit scheduled';
  if (status === 'NEGOTIATING') return 'Advisor preparing next steps';
  if (status === 'WON') return 'Property journey completed';
  return 'Enquiry closed';
}

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PreviewState>(createPreviewSeed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let restored: PreviewState | undefined;
    try {
      const stored = window.localStorage.getItem(PREVIEW_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isPreviewState(parsed)) restored = parsed;
      }
    } catch {
      window.localStorage.removeItem(PREVIEW_STORAGE_KEY);
    }
    queueMicrotask(() => {
      if (restored) setState(restored);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  useEffect(() => {
    function syncPreviewState(event: StorageEvent) {
      if (event.key !== PREVIEW_STORAGE_KEY || !event.newValue) return;
      try {
        const parsed: unknown = JSON.parse(event.newValue);
        if (isPreviewState(parsed)) setState(parsed);
      } catch {
        // Ignore malformed storage events from another tab.
      }
    }
    window.addEventListener('storage', syncPreviewState);
    return () => window.removeEventListener('storage', syncPreviewState);
  }, []);

  const reset = useCallback(() => {
    window.localStorage.removeItem(PREVIEW_STORAGE_KEY);
    setState(createPreviewSeed());
  }, []);

  const toggleSaved = useCallback((propertyId: string) => {
    setState((current) => {
      const property = current.properties.find((item) => item.id === propertyId);
      if (!property) return current;
      const isSaved = current.savedPropertyIds.includes(propertyId);
      const createdAt = new Date().toISOString();
      const next = {
        ...current,
        savedPropertyIds: isSaved
          ? current.savedPropertyIds.filter((id) => id !== propertyId)
          : [propertyId, ...current.savedPropertyIds],
      };
      return withActivity(
        next,
        isSaved ? 'Saved property removed' : 'Property saved',
        property.title,
        createdAt
      );
    });
  }, []);

  const addLead = useCallback((input: NewLeadInput) => {
    const property = state.properties.find(
      (item) => item.id === input.propertyId
    );
    if (!property) return false;
    const createdAt = new Date().toISOString();
    const customerName = state.profile.name;
    const lead: PreviewLead = {
      id: makeId('lead'),
      propertyId: property.id,
      propertySlug: property.slug,
      propertyTitle: property.title,
      customerName,
      enquiryType: property.purpose,
      source: input.source ?? 'PROPERTY_PAGE',
      agentId: property.agentId,
      status: 'NEW',
      customerStatus: customerLeadStatus('NEW'),
      message: input.message,
      internalNotes: [],
      history: [
        {
          id: makeId('history'),
          status: 'NEW',
          label: 'Enquiry received',
          createdAt,
        },
      ],
      createdAt,
      updatedAt: createdAt,
    };
    setState((current) => {
      const next = {
        ...current,
        leads: [lead, ...current.leads],
        notifications: [
          {
            id: makeId('notification'),
            title: 'Preview enquiry created',
            body: `Your enquiry about ${property.title} is now visible in the Customer Portal.`,
            propertySlug: property.slug,
            read: false,
            createdAt,
          },
          ...current.notifications,
        ],
      };
      return withActivity(next, 'New enquiry', `${customerName} · ${property.title}`, createdAt);
    });
    return true;
  }, [state.profile.name, state.properties]);

  const updateLeadStatus = useCallback(
    (leadId: string, status: LeadStatus) => {
      setState((current) => {
        const lead = current.leads.find((item) => item.id === leadId);
        if (!lead || lead.status === status) return current;
        const createdAt = new Date().toISOString();
        const next = {
          ...current,
          leads: current.leads.map((item) =>
            item.id === leadId
              ? {
                  ...item,
                  status,
                  customerStatus: customerLeadStatus(status),
                  updatedAt: createdAt,
                  history: [
                    ...item.history,
                    {
                      id: makeId('history'),
                      status,
                      label: `Status changed to ${previewLeadStatusLabel(status)}`,
                      createdAt,
                    },
                  ],
                }
              : item
          ),
        };
        return withActivity(
          next,
          'Lead status updated',
          `${lead.customerName} · ${previewLeadStatusLabel(status)}`,
          createdAt
        );
      });
    },
    []
  );

  const addLeadNote = useCallback((leadId: string, note: string) => {
    const cleanNote = note.trim();
    if (!cleanNote) return;
    setState((current) => ({
      ...current,
      leads: current.leads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              internalNotes: [...lead.internalNotes, cleanNote],
              updatedAt: new Date().toISOString(),
            }
          : lead
      ),
    }));
  }, []);

  const addVisit = useCallback(
    (input: NewVisitInput): VisitResult => {
      if (hasPreviewVisitConflict(state.visits, input.date, input.timeSlot)) {
        return {
          ok: false,
          message: 'That preview slot is already occupied. Choose another time.',
        };
      }
      const property = state.properties.find(
        (item) => item.id === input.propertyId
      );
      if (!property) return { ok: false, message: 'Property not found.' };
      const createdAt = new Date().toISOString();
      const visit: PreviewVisit = {
        id: makeId('visit'),
        propertyId: property.id,
        propertySlug: property.slug,
        propertyTitle: property.title,
        customerName: state.profile.name,
        agentId: property.agentId,
        date: input.date,
        timeSlot: input.timeSlot,
        visitType: input.visitType,
        status: 'PENDING',
        createdAt,
        updatedAt: createdAt,
      };
      setState((current) => {
        const next = {
          ...current,
          visits: [visit, ...current.visits],
          notifications: [
            {
              id: makeId('notification'),
              title: 'Preview visit requested',
              body: `${property.title} · ${input.date} at ${input.timeSlot}.`,
              propertySlug: property.slug,
              read: false,
              createdAt,
            },
            ...current.notifications,
          ],
        };
        return withActivity(
          next,
          'Visit requested',
          `${property.title} · ${input.date} at ${input.timeSlot}`,
          createdAt
        );
      });
      return { ok: true, message: 'Visit saved in this preview.' };
    },
    [state.profile.name, state.properties, state.visits]
  );

  const updateVisit = useCallback(
    (
      visitId: string,
      input: { date: string; timeSlot: PreviewTimeSlot; status?: VisitStatus }
    ): VisitResult => {
      if (
        hasPreviewVisitConflict(
          state.visits,
          input.date,
          input.timeSlot,
          visitId
        )
      ) {
        return {
          ok: false,
          message: 'That preview slot is already occupied. Choose another time.',
        };
      }
      const visit = state.visits.find((item) => item.id === visitId);
      if (!visit) return { ok: false, message: 'Visit not found.' };
      const createdAt = new Date().toISOString();
      const status = input.status ?? 'RESCHEDULED';
      setState((current) => {
        const next = {
          ...current,
          visits: current.visits.map((item) =>
            item.id === visitId
              ? {
                  ...item,
                  date: input.date,
                  timeSlot: input.timeSlot,
                  status,
                  updatedAt: createdAt,
                }
              : item
          ),
          notifications: [
            {
              id: makeId('notification'),
              title: 'Preview visit rescheduled',
              body: `${visit.propertyTitle} · ${input.date} at ${input.timeSlot}.`,
              propertySlug: visit.propertySlug,
              read: false,
              createdAt,
            },
            ...current.notifications,
          ],
        };
        return withActivity(
          next,
          'Visit rescheduled',
          `${visit.propertyTitle} · ${input.date} at ${input.timeSlot}`,
          createdAt
        );
      });
      return { ok: true, message: 'Visit rescheduled in this preview.' };
    },
    [state.visits]
  );

  const setVisitStatus = useCallback(
    (visitId: string, status: VisitStatus) => {
      setState((current) => {
        const visit = current.visits.find((item) => item.id === visitId);
        if (!visit || visit.status === status) return current;
        const createdAt = new Date().toISOString();
        const next = {
          ...current,
          visits: current.visits.map((item) =>
            item.id === visitId
              ? { ...item, status, updatedAt: createdAt }
              : item
          ),
          notifications: [
            {
              id: makeId('notification'),
              title: `Visit ${previewVisitStatusLabel(status).toLowerCase()}`,
              body: `${visit.propertyTitle} · ${visit.date} at ${visit.timeSlot}.`,
              propertySlug: visit.propertySlug,
              read: false,
              createdAt,
            },
            ...current.notifications,
          ],
        };
        return withActivity(
          next,
          `Visit ${previewVisitStatusLabel(status).toLowerCase()}`,
          `${visit.customerName} · ${visit.propertyTitle}`,
          createdAt
        );
      });
    },
    []
  );

  const markNotificationRead = useCallback((notificationId: string) => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    }));
  }, []);

  const updateProfile = useCallback((profile: PreviewProfile) => {
    setState((current) =>
      withActivity(
        { ...current, profile },
        'Profile updated',
        `${profile.name} · ${profile.preferredCity}`,
        new Date().toISOString()
      )
    );
  }, []);

  const saveProperty = useCallback(
    (property: Omit<PreviewProperty, 'createdAt' | 'updatedAt'>) => {
      const existing = state.properties.find((item) => item.id === property.id);
      const id = existing?.id ?? (property.id || makeId('property'));
      const createdAt = existing?.createdAt ?? new Date().toISOString();
      const updatedAt = new Date().toISOString();
      setState((current) => {
        const saved: PreviewProperty = {
          ...property,
          id,
          createdAt,
          updatedAt,
        };
        const next = {
          ...current,
          properties: existing
            ? current.properties.map((item) => (item.id === id ? saved : item))
            : [saved, ...current.properties],
        };
        return withActivity(
          next,
          existing ? 'Property edited' : 'Property created',
          saved.title,
          updatedAt
        );
      });
      return id;
    },
    [state.properties]
  );

  const deleteProperty = useCallback((propertyId: string) => {
    setState((current) => ({
      ...current,
      properties: current.properties.filter((item) => item.id !== propertyId),
      savedPropertyIds: current.savedPropertyIds.filter((id) => id !== propertyId),
    }));
  }, []);

  const movePropertyMedia = useCallback(
    (propertyId: string, mediaId: string, direction: -1 | 1) => {
      setState((current) => ({
        ...current,
        properties: current.properties.map((property) => {
          if (property.id !== propertyId) return property;
          const ordered = [...property.media].sort((a, b) => a.order - b.order);
          const currentIndex = ordered.findIndex((item) => item.id === mediaId);
          const targetIndex = currentIndex + direction;
          if (
            currentIndex < 0 ||
            targetIndex < 0 ||
            targetIndex >= ordered.length
          ) {
            return property;
          }
          const currentMedia = ordered[currentIndex];
          const targetMedia = ordered[targetIndex];
          if (!currentMedia || !targetMedia) return property;
          ordered[currentIndex] = targetMedia;
          ordered[targetIndex] = currentMedia;
          return {
            ...property,
            media: ordered.map((item, index) => ({ ...item, order: index })),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    []
  );

  const saveAgent = useCallback(
    (agent: Omit<PreviewAgent, 'createdAt'>) => {
      const existing = state.agents.find((item) => item.id === agent.id);
      const id = existing?.id ?? (agent.id || makeId('agent'));
      setState((current) => ({
        ...current,
        agents: existing
          ? current.agents.map((item) =>
              item.id === id ? { ...agent, id, createdAt: item.createdAt } : item
            )
          : [{ ...agent, id, createdAt: new Date().toISOString() }, ...current.agents],
      }));
      return id;
    },
    [state.agents]
  );

  const saveNeighborhood = useCallback((neighborhood: PreviewNeighborhood) => {
    setState((current) => ({
      ...current,
      neighborhoods: current.neighborhoods.map((item) =>
        item.id === neighborhood.id ? neighborhood : item
      ),
    }));
  }, []);

  const value = useMemo<PreviewContextValue>(
    () => ({
      state,
      ready,
      reset,
      toggleSaved,
      addLead,
      updateLeadStatus,
      addLeadNote,
      addVisit,
      updateVisit,
      setVisitStatus,
      markNotificationRead,
      markAllNotificationsRead,
      updateProfile,
      saveProperty,
      deleteProperty,
      movePropertyMedia,
      saveAgent,
      saveNeighborhood,
    }),
    [
      state,
      ready,
      reset,
      toggleSaved,
      addLead,
      updateLeadStatus,
      addLeadNote,
      addVisit,
      updateVisit,
      setVisitStatus,
      markNotificationRead,
      markAllNotificationsRead,
      updateProfile,
      saveProperty,
      deleteProperty,
      movePropertyMedia,
      saveAgent,
      saveNeighborhood,
    ]
  );

  return (
    <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreview must be used within PreviewProvider');
  }
  return context;
}

export function PreviewLoadingState() {
  return (
    <div className="preview-loading" role="status" aria-live="polite">
      <span aria-hidden="true" />
      <p>Preparing your private preview workspace…</p>
    </div>
  );
}

export const previewSchemaVersion = PREVIEW_SCHEMA_VERSION;
