import { HandLandmarkerResult } from "@mediapipe/tasks-vision";

export type VoxelShapeType = 'box' | 'sphere' | 'cone' | 'window' | 'door';

export type Voxel = {
  id: string;
  position: [number, number, number];
  color: string;
  shape: VoxelShapeType;
  dimensions: [number, number, number];
  layerId: string;
};

export type Layer = {
  id: string;
  name: string;
  isVisible: boolean;
};

export type EditMode = 'add' | 'remove' | 'line' | 'rectangle' | 'move';

export type CameraView = 'perspective' | 'top' | 'front' | 'side';

export type HandTrackerProps = {
    onLandmarks: (results: HandLandmarkerResult, timestamp: number) => void;
};

export type ControlsProps = {
    mode: EditMode;
    setMode: (mode: EditMode) => void;
    color: string;
    setColor: (color: string) => void;
    voxelShape: VoxelShapeType;
    setVoxelShape: (shape: VoxelShapeType) => void;
};

export type LayersPanelProps = {
    layers: Layer[];
    activeLayerId: string | null;
    onAddLayer: () => void;
    onRemoveLayer: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onSetActiveLayer: (id: string) => void;
    onRenameLayer: (id: string, newName: string) => void;
    onClearAll: () => void;
};