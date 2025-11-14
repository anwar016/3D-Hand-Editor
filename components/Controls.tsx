
import React from 'react';
import { ControlsProps, VoxelShapeType } from '../types';

// DB32 Palette
const COLORS = [
  '#000000', '#222034', '#45283c', '#663931', '#8f563b', '#df7126', '#d9a066', '#eec39a',
  '#fbf236', '#99e550', '#6abe30', '#37946e', '#4b692f', '#524b24', '#323c39', '#3f3f74',
  '#306082', '#5b6ee1', '#639bff', '#5fcde4', '#cbdbfc', '#ffffff', '#9badb7', '#847e87',
  '#696a6a', '#595652', '#76428a', '#ac3232', '#d95763', '#d77bba', '#8f974a', '#8a6f30'
];

// FIX: Changed JSX.Element to React.ReactElement to fix namespace error.
const SHAPES: { id: VoxelShapeType; label: string; icon: React.ReactElement }[] = [
    { id: 'box', label: 'Cube', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.236L19.098 8 12 11.764 4.902 8 12 4.236zM3 8.545l8 4.444v8.468L3 16.999V8.545zm17 8.454l-8 4.458V12.99l8-4.444v8.453z" /></svg> },
    { id: 'sphere', label: 'Sphere', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" /></svg> },
    { id: 'cone', label: 'Cone', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2L2 22h20L12 2z" /></svg> },
    { id: 'window', label: 'Window', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4 4h16v16H4V4zm2 2v5h5V6H6zm7 0v5h5V6h-5zm-7 7v5h5v-5H6zm7 0v5h5v-5h-5z" /></svg> },
    { id: 'door', label: 'Door', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8 4h8a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2zm6 9.5a1 1 0 100-2 1 1 0 000 2z" /></svg> },
];

const TOOLS = [
    { id: 'add', label: 'Add', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>},
    { id: 'line', label: 'Line', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4.929 19.071l14.142-14.142" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>},
    { id: 'rectangle', label: 'Rectangle', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>},
    { id: 'move', label: 'Move', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2L8 6h3v3L6 8v4l6 6 6-6v-4l-5 1v-3h3L12 2zM2 18h20v2H2v-2z" /></svg>},
    { id: 'remove', label: 'Remove', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19 13H5v-2h14v2z" /></svg>},
]

const Section: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="bg-[#2a2a2a] p-2 rounded-md">
        <h3 className="text-xs font-bold mb-2 text-gray-400 uppercase tracking-wider">{title}</h3>
        {children}
    </div>
);

const Controls: React.FC<ControlsProps> = ({ 
    mode, setMode, 
    color, setColor, 
    voxelShape, setVoxelShape,
}) => {
    
    const baseButtonClass = "flex items-center justify-center p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
    
  return (
    <div className="flex flex-col gap-3">
      <Section title="Tools">
        <div className="grid grid-cols-3 gap-1">
          {TOOLS.map(tool => (
             <button key={tool.id} onClick={() => setMode(tool.id as any)} title={tool.label} className={`${baseButtonClass} ${mode === tool.id ? 'bg-blue-600 text-white' : 'bg-[#3c3c3c] hover:bg-[#4f4f4f] text-gray-300'} focus:ring-blue-500`}>
                {tool.icon}
             </button>
          ))}
        </div>
      </Section>

      <Section title="Shape">
        <div className="grid grid-cols-3 gap-1">
            {SHAPES.map(shape => (
                 <button 
                    key={shape.id}
                    title={shape.label}
                    onClick={() => setVoxelShape(shape.id)} 
                    className={`${baseButtonClass} ${voxelShape === shape.id ? 'bg-blue-600 text-white' : 'bg-[#3c3c3c] hover:bg-[#4f4f4f] text-gray-300'} focus:ring-blue-500`}>
                    {shape.icon}
                </button>
            ))}
        </div>
      </Section>

      <Section title="Palette">
        <div className="grid grid-cols-8 gap-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-full aspect-square rounded transition-transform duration-150 ${color === c ? 'ring-2 ring-offset-2 ring-offset-[#333333] ring-white scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </Section>
    </div>
  );
};

export default Controls;
