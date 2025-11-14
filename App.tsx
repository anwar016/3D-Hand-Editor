
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Voxel, EditMode, VoxelShapeType, CameraView, Layer } from './types';
import HandTracker from './components/HandTracker';
import VoxelEditor from './components/VoxelEditor';
import Controls from './components/Controls';
import LayersPanel from './components/LayersPanel';
import { HandLandmarkerResult, Landmark } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { useMemo } from 'react';

const GRID_SIZE = 32;
const PINCH_THRESHOLD = 0.05;
const FIST_THRESHOLD = 0.1;
const PAN_THRESHOLD = 0.06;

const App: React.FC = () => {
    const [voxels, setVoxels] = useState<{ [id: string]: Voxel }>({});
    const [layers, setLayers] = useState<Layer[]>([{ id: 'default', name: 'Layer 1', isVisible: true }]);
    const [activeLayerId, setActiveLayerId] = useState<string>('default');
    
    const [mode, setMode] = useState<EditMode>('add');
    const [color, setColor] = useState<string>('#4ade80');
    const [voxelShape, setVoxelShape] = useState<VoxelShapeType>('box');
    const [voxelDimensions, setVoxelDimensions] = useState<[number, number, number]>([1, 1, 1]);

    const [lineStartPoint, setLineStartPoint] = useState<[number, number, number] | null>(null);
    const [rectStartPoint, setRectStartPoint] = useState<[number, number, number] | null>(null);
    const [selectedVoxel, setSelectedVoxel] = useState<Voxel | null>(null);

    const [rightCursorPosition, setRightCursorPosition] = useState<[number, number, number]>([0, 0, 0]);
    const [leftCursorPosition, setLeftCursorPosition] = useState<[number, number, number]>([0, 0, 0]);
    const [rightHandDetected, setRightHandDetected] = useState(false);
    const [leftHandDetected, setLeftHandDetected] = useState(false);
    
    const [mouseCursorPosition, setMouseCursorPosition] = useState<[number, number, number] | null>(null);

    const [rightIsPinching, setRightIsPinching] = useState(false);
    const [leftIsFist, setLeftIsFist] = useState(false);
    const [leftIsPanning, setLeftIsPanning] = useState(false);
    
    const [cameraRotation, setCameraRotation] = useState<[number, number]>([0.5, 0.5]);
    const [cameraZoom, setCameraZoom] = useState<number>(50);
    const [cameraPan, setCameraPan] = useState<[number, number]>([0, 0]);
    
    const wasPinchingRef = useRef(false);
    const lastHandPositionRef = useRef<{ x: number, y: number } | null>(null);

    const isPositionValid = (pos: [number, number, number]) => {
         return !(Math.abs(pos[0]) > GRID_SIZE / 2 ||
            pos[1] < 0 || pos[1] > GRID_SIZE ||
            Math.abs(pos[2]) > GRID_SIZE / 2);
    }

    const addVoxel = useCallback((position: [number, number, number], color: string, shape: VoxelShapeType, dimensions: [number, number, number]) => {
        if (!activeLayerId) return;
        const roundedPos: [number, number, number] = [Math.round(position[0]), Math.round(position[1]), Math.round(position[2])];
        if (!isPositionValid(roundedPos)) return;

        const positionKey = roundedPos.join(',');
        const isOccupied = Object.values(voxels).some(v => v.position.join(',') === positionKey);
        if (isOccupied) return;

        const id = crypto.randomUUID();
        const newVoxel: Voxel = { id, position: roundedPos, color, shape, dimensions, layerId: activeLayerId };
        setVoxels(prev => ({...prev, [id]: newVoxel}));
    }, [activeLayerId, voxels]);

    const addVoxelsBatch = useCallback((newVoxelsList: Omit<Voxel, 'id'>[]) => {
        if (!activeLayerId) return;
        setVoxels(prev => {
            const allVoxels = Object.values(prev);
            const existingPositions = new Set(allVoxels.map(v => v.position.join(',')));
            const newBatch: {[id: string]: Voxel} = {};
            newVoxelsList.forEach(vData => {
                const posKey = vData.position.join(',');
                if (!existingPositions.has(posKey)) {
                    const id = crypto.randomUUID();
                    newBatch[id] = {...vData, id};
                    existingPositions.add(posKey);
                }
            });
            return {...prev, ...newBatch};
        });
    }, [activeLayerId]);

    const addVoxelLine = useCallback((start: [number, number, number], end: [number, number, number], color: string, shape: VoxelShapeType, dimensions: [number, number, number]) => {
        if (!activeLayerId) return;
        const startVec = new THREE.Vector3(...start.map(Math.round));
        const endVec = new THREE.Vector3(...end.map(Math.round));
        const distance = startVec.distanceTo(endVec);
        const newVoxelsData: Omit<Voxel, 'id'>[] = [];

        for (let i = 0; i <= distance; i++) {
            const point = new THREE.Vector3().lerpVectors(startVec, endVec, i / distance).round();
            const roundedPos: [number, number, number] = [point.x, point.y, point.z];
            if (isPositionValid(roundedPos)) {
                 newVoxelsData.push({ position: roundedPos, color, shape, dimensions, layerId: activeLayerId });
            }
        }
        addVoxelsBatch(newVoxelsData);
    }, [addVoxelsBatch, activeLayerId]);
    
    const addVoxelRectangle = useCallback((start: [number, number, number], end: [number, number, number], color: string, shape: VoxelShapeType, dimensions: [number, number, number]) => {
        if (!activeLayerId) return;
        const [x1, y1, z1] = start.map(Math.round);
        const [x2, y2, z2] = end.map(Math.round);
        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
        const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);
        const newVoxelsData: Omit<Voxel, 'id'>[] = [];

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const roundedPos: [number, number, number] = [x, y, z];
                     if (isPositionValid(roundedPos)) {
                        newVoxelsData.push({ position: roundedPos, color, shape, dimensions, layerId: activeLayerId });
                    }
                }
            }
        }
        addVoxelsBatch(newVoxelsData);
    }, [addVoxelsBatch, activeLayerId]);

    const removeVoxel = useCallback((position: [number, number, number]) => {
        if (!activeLayerId) return;
        const roundedPos = position.map(p => Math.round(p)).join(',');
        const voxelToRemove = Object.values(voxels).find(v => v.layerId === activeLayerId && v.position.join(',') === roundedPos);
        if (voxelToRemove) {
            setVoxels(prev => {
                const next = {...prev};
                delete next[voxelToRemove.id];
                return next;
            });
        }
    }, [voxels, activeLayerId]);

    const moveVoxel = useCallback((voxelId: string, newPosition: [number, number, number]) => {
        const roundedPos: [number, number, number] = newPosition.map(p => Math.round(p)) as [number, number, number];
         if (!isPositionValid(roundedPos)) return;
         setVoxels(prev => ({...prev, [voxelId]: { ...prev[voxelId], position: roundedPos }}));
    }, []);

    const handleClearAll = () => {
        setVoxels({});
        setLayers([{ id: 'default', name: 'Layer 1', isVisible: true }]);
        setActiveLayerId('default');
    };

    const handleAddLayer = () => {
        const newLayer: Layer = { id: crypto.randomUUID(), name: `Layer ${layers.length + 1}`, isVisible: true };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
    };
    const handleRemoveLayer = (id: string) => {
        setLayers(prev => prev.filter(l => l.id !== id));
        setVoxels(prev => {
            const next = {...prev};
            Object.values(next).forEach(v => {
                if (v.layerId === id) delete next[v.id];
            });
            return next;
        });
        if (activeLayerId === id) {
            setActiveLayerId(layers[0]?.id || null);
        }
    };
    const handleToggleVisibility = (id: string) => setLayers(prev => prev.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l));
    const handleRenameLayer = (id: string, newName: string) => setLayers(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));

    const getDistance = (p1: Landmark, p2: Landmark) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
    const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => Math.max(outMin, Math.min(outMax, (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin));

    const handleLandmarks = useCallback((results: HandLandmarkerResult) => {
        const leftHand = results.landmarks.find((_, i) => results.handedness[i][0].categoryName === 'Left');
        const rightHand = results.landmarks.find((_, i) => results.handedness[i][0].categoryName === 'Right');

        setRightHandDetected(!!rightHand);
        setLeftHandDetected(!!leftHand);

        if (rightHand) {
            const indexTip = rightHand[8];
            const thumbTip = rightHand[4];

            const newX = (0.5 - indexTip.x) * GRID_SIZE * 1.5;
            const newY = (0.5 - indexTip.y) * GRID_SIZE * 1.5;
            const newZ = -indexTip.z * GRID_SIZE * 3;
            setRightCursorPosition([newX, newY, newZ]);

            const pinchDistance = getDistance(thumbTip, indexTip);
            const isPinching = pinchDistance < PINCH_THRESHOLD;
            setRightIsPinching(isPinching);
        } else {
            setRightIsPinching(false);
        }

        if (leftHand) {
            const indexTip = leftHand[8], middleTip = leftHand[12], ringTip = leftHand[16], pinkyTip = leftHand[20], wrist = leftHand[0], thumbTip = leftHand[4];
            setLeftCursorPosition([(0.5 - indexTip.x) * GRID_SIZE * 1.5, (0.5 - indexTip.y) * GRID_SIZE * 1.5, -indexTip.z * GRID_SIZE * 3]);
            const currentPos = { x: wrist.x, y: wrist.y };
            const avgFingerDist = (getDistance(indexTip, wrist) + getDistance(middleTip, wrist) + getDistance(ringTip, wrist) + getDistance(pinkyTip, wrist)) / 4;
            const isFistDetected = avgFingerDist < FIST_THRESHOLD;
            setLeftIsFist(isFistDetected);
            const panDist = (getDistance(thumbTip, indexTip) + getDistance(thumbTip, middleTip)) / 2;
            const isPanDetected = !isFistDetected && panDist < PAN_THRESHOLD;
            setLeftIsPanning(isPanDetected);

            if (isFistDetected) {
                if (lastHandPositionRef.current) {
                    const dx = currentPos.x - lastHandPositionRef.current.x, dy = currentPos.y - lastHandPositionRef.current.y;
                    setCameraRotation(prev => [prev[0] - dx * 4, Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, prev[1] - dy * 4))]);
                }
            } else if (isPanDetected) {
                if (lastHandPositionRef.current) {
                    const dx = currentPos.x - lastHandPositionRef.current.x, dy = currentPos.y - lastHandPositionRef.current.y;
                    setCameraPan([dx * 20, dy * 20]);
                }
            } else {
                const zoomDist = getDistance(indexTip, pinkyTip);
                const newZoom = 70 - (mapRange(zoomDist, 0.05, 0.35, 0, 1) * (70 - 10));
                setCameraZoom(newZoom);
            }
            lastHandPositionRef.current = currentPos;
        } else {
            lastHandPositionRef.current = null;
            setCameraPan([0, 0]);
            setLeftIsFist(false);
            setLeftIsPanning(false);
        }
    }, []);

    const handlePrimaryAction = useCallback((position: [number, number, number]) => {
        if (!activeLayerId) return;
        const roundedPos: [number, number, number] = [Math.round(position[0]), Math.round(position[1]), Math.round(position[2])];

        switch (mode) {
            case 'add':
                addVoxel(position, color, voxelShape, voxelDimensions);
                break;
            case 'remove':
                removeVoxel(position);
                break;
            case 'line':
                if (!lineStartPoint) setLineStartPoint(roundedPos);
                else {
                    addVoxelLine(lineStartPoint, position, color, voxelShape, voxelDimensions);
                    setLineStartPoint(null);
                }
                break;
            case 'rectangle':
                 if (!rectStartPoint) setRectStartPoint(roundedPos);
                 else {
                    addVoxelRectangle(rectStartPoint, position, color, voxelShape, voxelDimensions);
                    setRectStartPoint(null);
                }
                break;
            case 'move':
                if (!selectedVoxel) {
                    const posKey = roundedPos.join(',');
                    const voxelToSelect = Object.values(voxels).find(v => v.layerId === activeLayerId && v.position.join(',') === posKey);
                    if (voxelToSelect) setSelectedVoxel(voxelToSelect);
                } else {
                    moveVoxel(selectedVoxel.id, position);
                    setSelectedVoxel(null);
                }
                break;
        }
    }, [mode, color, voxelShape, voxelDimensions, addVoxel, removeVoxel, lineStartPoint, addVoxelLine, rectStartPoint, addVoxelRectangle, selectedVoxel, voxels, moveVoxel, activeLayerId]);

    useEffect(() => {
        if (rightIsPinching && !wasPinchingRef.current) {
            handlePrimaryAction(rightCursorPosition);
        }
        wasPinchingRef.current = rightIsPinching;
    }, [rightIsPinching, rightCursorPosition, handlePrimaryAction]);

    useEffect(() => {
        if (mode !== 'line') setLineStartPoint(null);
        if (mode !== 'rectangle') setRectStartPoint(null);
        if (mode !== 'move') setSelectedVoxel(null);
    }, [mode]);

    const visibleVoxels = useMemo(() => {
        const visibleLayerIds = new Set(layers.filter(l => l.isVisible).map(l => l.id));
        return Object.values(voxels).filter(v => visibleLayerIds.has(v.layerId));
    }, [voxels, layers]);

    return (
        <div className="w-screen h-screen bg-gray-800 text-white overflow-hidden flex">
            {/* Left Sidebar */}
            <div className="w-64 h-full bg-[#333333] flex-shrink-0 p-3 flex flex-col gap-4 overflow-y-auto">
                <Controls
                    mode={mode} setMode={setMode}
                    color={color} setColor={setColor}
                    voxelShape={voxelShape} setVoxelShape={setVoxelShape}
                />
                 <div className="mt-auto">
                    <HandTracker onLandmarks={handleLandmarks} />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow h-full relative">
                <VoxelEditor
                    voxels={visibleVoxels}
                    activeLayerId={activeLayerId}
                    rightCursorPosition={rightCursorPosition}
                    leftCursorPosition={leftCursorPosition}
                    isPinching={rightIsPinching}
                    editMode={mode}
                    isGesturing={leftIsFist || leftIsPanning}
                    rightHandDetected={rightHandDetected}
                    leftHandDetected={leftHandDetected}
                    cameraRotation={cameraRotation}
                    cameraZoom={cameraZoom}
                    cameraPan={cameraPan}
                    cameraView={'perspective'} // Simplified for now
                    voxelShape={voxelShape}
                    voxelDimensions={voxelDimensions}
                    lineStartPoint={lineStartPoint}
                    rectStartPoint={rectStartPoint}
                    selectedVoxel={selectedVoxel}
                    onMouseAction={handlePrimaryAction}
                    mouseCursorPosition={mouseCursorPosition}
                    setMouseCursorPosition={setMouseCursorPosition}
                />
            </div>
            
            {/* Right Sidebar */}
            <div className="w-64 h-full bg-[#333333] flex-shrink-0 p-3 overflow-y-auto">
                <LayersPanel
                    layers={layers}
                    activeLayerId={activeLayerId}
                    onAddLayer={handleAddLayer}
                    onRemoveLayer={handleRemoveLayer}
                    onToggleVisibility={handleToggleVisibility}
                    onSetActiveLayer={setActiveLayerId}
                    onRenameLayer={handleRenameLayer}
                    onClearAll={handleClearAll}
                />
            </div>
        </div>
    );
};

export default App;
