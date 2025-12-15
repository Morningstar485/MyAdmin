import { supabase } from '../lib/supabase';
import { LogIn } from 'lucide-react';

export function LoginScreen() {
    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href
            }
        });
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -top-20 -left-20"></div>
            <div className="absolute w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] bottom-0 right-0"></div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-sm rounded-3xl p-8 backdrop-blur-xl bg-slate-900/60 border border-white/10 shadow-2xl flex flex-col items-center">
                <div className="mb-8 p-4 rounded-2xl bg-indigo-500/10 text-indigo-400">
                    <LogIn size={40} />
                </div>

                <h1 className="text-3xl font-light text-white tracking-tight mb-2">MyAdmin</h1>
                <p className="text-slate-400 text-sm mb-8 text-center">
                    Sign in to access your personal productivity dashboard.
                </p>

                <button
                    onClick={handleLogin}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white text-slate-900 font-medium hover:bg-slate-100 transition-colors duration-200"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}
