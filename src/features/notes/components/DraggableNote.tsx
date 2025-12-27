import { useDraggable } from '@dnd-kit/core';
import type { Note } from '../types';
import { NoteCard } from './NoteCard';

interface DraggableNoteProps {
    note: Note;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
}

export function DraggableNote({ note, onClick, onDelete }: DraggableNoteProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `note-${note.id}`,
        data: {
            type: 'note',
            note
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={isDragging ? 'opacity-50' : ''}
        >
            <NoteCard
                note={note}
                onClick={onClick}
                onDelete={onDelete}
            />
        </div>
    );
}
