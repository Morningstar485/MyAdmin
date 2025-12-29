import { useState, useEffect, useCallback } from 'react';

// Types for Google Picker API
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

interface PickerCallback {
    action: string;
    docs: Array<{
        id: string;
        name: string;
        mimeType: string;
        embedUrl: string;
        url: string;
    }>;
}

interface UseGoogleDrivePickerProps {
    clientId: string;
    developerKey: string;
}

export function useGoogleDrivePicker({ clientId, developerKey }: UseGoogleDrivePickerProps) {
    const [isApiLoaded, setIsApiLoaded] = useState(false);
    const [isGisLoaded, setIsGisLoaded] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);

    // Load Scripts
    useEffect(() => {
        const loadGapi = () => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.async = true;
            script.onload = () => {
                window.gapi.load('picker', () => {
                    setIsApiLoaded(true);
                });
            };
            document.body.appendChild(script);
        };

        const loadGis = () => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.onload = () => {
                setIsGisLoaded(true);
            };
            document.body.appendChild(script);
        };

        loadGapi();
        loadGis();
    }, []);

    // Initialize Token Client
    useEffect(() => {
        if (isGisLoaded && clientId) {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.file', // Only access files opened/created by the app + selected in Picker
                callback: '', // Will be set dynamically
            });
            setTokenClient(client);
        }
    }, [isGisLoaded, clientId]);

    const openPicker = useCallback((onSelect: (file: { id: string, name: string, embedUrl: string, mimeType: string }) => void) => {
        if (!isApiLoaded || !tokenClient) {
            console.warn('Google Picker API not fully loaded yet.');
            return;
        }

        // Callback when user authorizes (or already has)
        tokenClient.callback = async (response: any) => {
            if (response.error !== undefined) {
                console.error('Auth error', response);
                return;
            }

            const accessToken = response.access_token;

            const pickerCallback = (data: PickerCallback) => {
                if (data.action === window.google.picker.Action.PICKED) {
                    const doc = data.docs[0];
                    onSelect({
                        id: doc.id,
                        name: doc.name,
                        embedUrl: doc.embedUrl,
                        mimeType: doc.mimeType
                    });
                }
            };

            const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
            view.setMimeTypes('application/pdf'); // Only PDFs for now

            const picker = new window.google.picker.PickerBuilder()
                .setDeveloperKey(developerKey.trim())
                .setAppId((import.meta.env.VITE_GOOGLE_APP_ID || '').trim())
                .setOAuthToken(accessToken)
                .addView(view)
                .addView(new window.google.picker.DocsUploadView()) // Allow uploads
                .setCallback(pickerCallback)
                .build();

            picker.setVisible(true);
        };

        // Trigger Auth Flow (Popup)
        tokenClient.requestAccessToken({ prompt: '' });

    }, [isApiLoaded, tokenClient, developerKey]);

    return { openPicker, isReady: isApiLoaded && !!tokenClient };
}
