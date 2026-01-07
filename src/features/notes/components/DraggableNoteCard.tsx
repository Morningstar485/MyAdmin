import { useDraggable } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import type { Note } from '../types';

interface DraggableNoteCardProps {
    note: Note;
    children: ReactNode;
}

export function DraggableNoteCard({ note, children }: DraggableNoteCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `note-${note.id}`,
        data: {
            type: 'note',
            note // Pass full note data for overlay
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 grayscale"
            >
                {children}
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="touch-none" // Recommended for dnd-kit on mobile/touch
        >
            {children}
        </div>
    );
}
