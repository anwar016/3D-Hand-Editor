import React, { useState } from 'react';
import { LayersPanelProps } from '../types';

const LayersPanel: React.FC<LayersPanelProps> = ({
    layers,
    activeLayerId,
    onAddLayer,
    onRemoveLayer,
    onToggleVisibility,
    onSetActiveLayer,
    onRenameLayer,
    onClearAll,
}) => {

    const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
    const [tempLayerName, setTempLayerName] = useState('');

    const handleRenameStart = (id: string, name: string) => {
        setEditingLayerId(id);
        setTempLayerName(name);
    }

    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLayerId && tempLayerName.trim() !== '') {
            onRenameLayer(editingLayerId, tempLayerName.trim());
        }
        setEditingLayerId(null);
    }

    const handleRenameCancel = () => {
        setEditingLayerId(null);
    }

    const actionButtonClass = "flex items-center justify-center p-1 rounded transition-colors duration-200 bg-[#3c3c3c] hover:bg-[#4f4f4f] text-gray-300";

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="bg-[#2a2a2a] p-2 rounded-md flex-grow flex flex-col">
                <h3 className="text-xs font-bold mb-2 text-gray-400 uppercase tracking-wider">Layers</h3>
                <div className="flex-grow space-y-1 overflow-y-auto pr-1">
                    {layers.map(layer => (
                        <div
                            key={layer.id}
                            onClick={() => onSetActiveLayer(layer.id)}
                            onDoubleClick={() => handleRenameStart(layer.id, layer.name)}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors duration-150 ${activeLayerId === layer.id ? 'bg-blue-600 text-white' : 'bg-[#3c3c3c] hover:bg-[#4f4f4f] text-gray-300'}`}
                        >
                            <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }} className="focus:outline-none">
                                {layer.isVisible ? 
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg> : 
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" /></svg>
                                }
                            </button>
                            {editingLayerId === layer.id ? (
                                <form onSubmit={handleRenameSubmit} className="flex-grow">
                                    <input 
                                        type="text"
                                        value={tempLayerName}
                                        onChange={(e) => setTempLayerName(e.target.value)}
                                        onBlur={handleRenameCancel}
                                        autoFocus
                                        className="w-full bg-gray-800 text-white p-0 m-0 border-none outline-none"
                                    />
                                </form>
                            ) : (
                                <span className="flex-grow truncate">{layer.name}</span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-gray-600">
                    <button onClick={onAddLayer} title="Add Layer" className={actionButtonClass}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" /></svg>
                    </button>
                    <button onClick={() => activeLayerId && onRemoveLayer(activeLayerId)} title="Remove Selected Layer" className={`${actionButtonClass} disabled:opacity-50`} disabled={!activeLayerId || layers.length <= 1}>
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M5 11h14v2H5z" /></svg>
                    </button>
                </div>
            </div>
             <button onClick={onClearAll} className="w-full p-2 rounded text-sm transition-colors duration-200 bg-red-800 hover:bg-red-700 text-red-100">
                Clear Scene
            </button>
        </div>
    );
};

export default LayersPanel;
