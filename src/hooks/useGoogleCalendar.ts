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
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCalendarEvents() {
            try {
                // 1. Get Session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw new Error(sessionError.message);
                if (!session) throw new Error('No active session found');

                // 2. Extract Token
                const providerToken = session.provider_token;

                // console.log('Google Calendar Provider Token:', providerToken ? 'Token exists' : 'Token missing');

                if (!providerToken) {
                    // Attempting to proceed might fail, but let's warn. 
                    // Often provider_token is missing on refresh if not persisted.
                    throw new Error('Google provider token not found. You may need to re-login.');
                }

                // 3. API Request
                const timeMin = new Date().toISOString();
                const response = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=7&singleEvents=true&orderBy=startTime`,
                    {
                        headers: {
                            'Authorization': `Bearer ${providerToken}`
                        }
                    }
                );

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error?.message || 'Failed to fetch calendar events');
                }

                const data = await response.json();
                setEvents(data.items || []);

            } catch (err: unknown) {
                console.error('Error fetching calendar events:', err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        }

        fetchCalendarEvents();
    }, []);

    return { events, loading, error };
}
