import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface DroppableFolderProps {
    folderId: string;
    children: ReactNode;
    className?: string; // To allow merging classes if needed
}

export function DroppableFolder({ folderId, children, className = '' }: DroppableFolderProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: `folder-${folderId}`,
        data: {
            type: 'folder',
            id: folderId
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`transition-all duration-200 rounded-2xl ${isOver ? 'ring-2 ring-indigo-400 bg-indigo-500/10 scale-[1.02]' : ''
                } ${className}`}
        >
            {children}
        </div>
    );
}
