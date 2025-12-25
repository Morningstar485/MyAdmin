import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type NavigationBlocker = () => boolean;

interface NavigationContextType {
    setBlocker: (blocker: NavigationBlocker | null) => void;
    confirmNavigation: (onConfirm: () => void) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
    const [blocker, setBlockerState] = useState<NavigationBlocker | null>(null);

    const setBlocker = useCallback((newBlocker: NavigationBlocker | null) => {
        setBlockerState(() => newBlocker);
    }, []);

    const confirmNavigation = useCallback((onConfirm: () => void) => {
        if (blocker) {
            const shouldBlock = blocker();
            if (shouldBlock) {
                if (window.confirm("You have unsaved changes. Are you sure you want to leave? Changes will be lost.")) {
                    onConfirm();
                }
                return;
            }
        }
        onConfirm();
    }, [blocker]);

    return (
        <NavigationContext.Provider value={{ setBlocker, confirmNavigation }}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}
