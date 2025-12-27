import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    htmlLink?: string;
}

interface UseGoogleCalendarReturn {
    events: CalendarEvent[];
    loading: boolean;
    error: string | null;
    createEvent: (title: string, startTime: Date, durationMinutes: number, description?: string) => Promise<boolean>;
    refreshEvents: () => Promise<void>;
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getProviderToken = async () => {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error(sessionError.message);
        if (!session) throw new Error('No active session found');

        const providerToken = session.provider_token;
        if (!providerToken) throw new Error('Google provider token not found. You may need to re-login.');

        return providerToken;
    };

    const fetchCalendarEvents = async () => {
        setLoading(true);
        try {
            const token = await getProviderToken();
            const timeMin = new Date().toISOString();

            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=7&singleEvents=true&orderBy=startTime`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Failed to fetch calendar events');
            }

            const data = await response.json();
            setEvents(data.items || []);
            setError(null);
        } catch (err: unknown) {
            console.error('Error fetching calendar events:', err);
            if (err instanceof Error) setError(err.message);
            else setError('Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const createEvent = async (title: string, startTime: Date, durationMinutes: number, description?: string): Promise<boolean> => {
        try {
            const token = await getProviderToken();

            const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

            const event = {
                summary: title,
                description: description,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: endTime.toISOString() },
            };

            const response = await fetch(
                'https://www.googleapis.com/calendar/v3/calendars/primary/events',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(event),
                }
            );

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Failed to create event');
            }

            await fetchCalendarEvents(); // Refresh after success
            return true;
        } catch (err) {
            console.error('Error creating event:', err);
            if (err instanceof Error) setError(err.message);
            else setError('Failed to create event');
            return false;
        }
    };

    useEffect(() => {
        fetchCalendarEvents();
    }, []);

    return { events, loading, error, createEvent, refreshEvents: fetchCalendarEvents };
}
