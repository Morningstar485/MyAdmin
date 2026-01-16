import { format } from 'date-fns';
import { ConsistencyAnchor } from './components/ConsistencyAnchor';
import { FocusTriad } from './components/FocusTriad';
import { ProjectWatch } from './components/ProjectWatch';
import { QuickCapture } from './components/QuickCapture';
import { LearningVelocity } from './components/LearningVelocity';

export function Dashboard() {
    const today = new Date();

    return (
        <div className="h-full bg-slate-950 p-8 overflow-y-auto text-slate-200">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <header className="flex items-end justify-between pb-2 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">My Dashboard</h1>
                        <p className="text-slate-400 mt-1 font-medium">
                            {format(today, 'EEEE, MMMM do, yyyy')}
                        </p>
                    </div>
                </header>

                {/* Bento Grid */}
                <div key="active-grid" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

                    {/* Row 1 & 2 */}
                    <ConsistencyAnchor />
                    <FocusTriad />

                    {/* Right Column Stack */}
                    <CalendarWidget />
                    <LearningVelocity />

                    {/* Row 3 */}
                    <ProjectWatch />
                    <QuickCapture />
                </div>
            </div>
        </div>
    );
}

// Minimal Calendar Widget
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { Calendar as CalendarIcon, CheckCircle } from 'lucide-react';

function CalendarWidget() {
    const { events, loading } = useGoogleCalendar();

    return (
        <div className="col-span-1 row-span-1 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col overflow-hidden h-[340px]">
            <div className="p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-800/20">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                    <CalendarIcon size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Upcoming Events</h3>
                    <p className="text-xs text-slate-500">{events.length} events</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/30 pr-2">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading...</div>
                ) : events.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4 opacity-60">
                        <CheckCircle size={24} className="mb-2" />
                        <p className="text-xs">No events</p>
                    </div>
                ) : (
                    events.map(event => {
                        const start = event.start.dateTime ? new Date(event.start.dateTime) : (event.start.date ? new Date(event.start.date) : null);
                        const timeStr = start ? format(start, 'MMM d, h:mm a') : 'All Day';
                        return (
                            <div key={event.id} className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">{timeStr}</span>
                                <span className="text-sm font-medium text-slate-300 line-clamp-2">{event.summary}</span>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}
