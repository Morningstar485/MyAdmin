import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { TaskCard } from './TaskCard';
import type { Todo } from '../types';

interface SortableTaskItemProps {
    todo: Todo;
    onToggle: (id: string) => void;
    isEditing?: boolean;
    onDelete?: (id: string) => void;
    onEdit?: (todo: Todo) => void;
    onClick?: (todo: Todo) => void;
}

export function SortableTaskItem(props: SortableTaskItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.todo.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 1,
        position: 'relative' as const, // Needed for layout animations sometimes
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            layout
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
        >
            <TaskCard
                {...props}
                onClick={props.onClick}
            />
        </motion.div>
    );
}
