import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import logo from '../assets/logo.png';

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show our custom notification after a short delay
            setTimeout(() => setIsVisible(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the PWA install prompt');
        } else {
            console.log('User dismissed the PWA install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0, x: '-50%' }}
                    animate={{ y: 20, opacity: 1, x: '-50%' }}
                    exit={{ y: -100, opacity: 0, x: '-50%' }}
                    className="fixed top-0 left-1/2 z-[100] w-[90%] max-w-sm"
                >
                    <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4 backdrop-blur-xl">
                        <div className="w-12 h-12 rounded-xl bg-slate-950/50 border border-white/5 p-2 shrink-0">
                            <img src={logo} alt="MyAdmin" className="w-full h-full object-contain" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">Install MyAdmin</h3>
                            <p className="text-xs text-slate-400 truncate">For a better experience</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleInstall}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <Download size={14} />
                                Install
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-1.5 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
