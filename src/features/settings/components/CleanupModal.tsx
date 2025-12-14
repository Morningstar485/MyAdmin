import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/Modal';

interface CleanupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    date: string;
    isDeleting: boolean;
}

export function CleanupModal({ isOpen, onClose, onConfirm, date, isDeleting }: CleanupModalProps) {
    const [confirmationText, setConfirmationText] = useState('');
    const EXPECTED_TEXT = "Confirm Clear Database";

    const handleConfirm = () => {
        if (confirmationText === EXPECTED_TEXT) {
            onConfirm();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Irreversible Data Loss Warning">
            <div className="space-y-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" size={24} />
                    <div>
                        <h4 className="font-bold text-red-500 mb-1">You are about to delete archived data</h4>
                        <p className="text-sm text-red-200/80">
                            This action will permanently delete all archived tasks created before <span className="font-mono bg-red-500/20 px-1 rounded">{date}</span>. This cannot be undone.
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                        To confirm, type <span className="text-white font-mono select-all">"{EXPECTED_TEXT}"</span> below:
                    </label>
                    <input
                        type="text"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder={EXPECTED_TEXT}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-mono"
                        onPaste={(e) => e.preventDefault()}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={confirmationText !== EXPECTED_TEXT || isDeleting}
                        className={`
                            px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2
                            ${confirmationText === EXPECTED_TEXT && !isDeleting
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }
                        `}
                    >
                        {isDeleting ? 'Deleting...' : (
                            <>
                                <Trash2 size={16} />
                                Delete Forever
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
