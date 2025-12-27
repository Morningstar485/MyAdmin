import type { Folder as FolderType } from '../types';
import { Folder } from 'lucide-react';

interface FolderCardProps {
    folder: FolderType;
    onClick: (folder: FolderType) => void;
}

export function FolderCard({ folder, onClick }: FolderCardProps) {
    return (
        <div
            onClick={() => onClick(folder)}
            className="
                group flex flex-col items-center justify-center p-4 
                bg-slate-800/40 border border-slate-700/50 rounded-xl
                hover:bg-slate-800 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10
                cursor-pointer transition-all duration-200
            "
        >
            <Folder size={48} className="text-slate-400 group-hover:text-indigo-400 transition-colors mb-3" />
            <span className="text-sm font-medium text-slate-300 group-hover:text-white truncate w-full text-center">
                {folder.name}
            </span>
        </div>
    );
}
