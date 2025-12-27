import { useDroppable } from '@dnd-kit/core';
import type { Folder } from '../types';
import { FolderCard } from './FolderCard';

interface DroppableFolderProps {
    folder: Folder;
    onClick: () => void;
}

export function DroppableFolder({ folder, onClick }: DroppableFolderProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `folder-${folder.id}`,
        data: {
            type: 'folder',
            folder
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`transition-all rounded-xl ${isOver ? 'ring-2 ring-indigo-500 scale-105 bg-indigo-500/10' : ''}`}
        >
            <FolderCard
                folder={folder}
                onClick={onClick}
            />
        </div>
    );
}
