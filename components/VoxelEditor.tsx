
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Sphere, Cone, Line, Edges } from '@react-three/drei';
import { Voxel, EditMode, VoxelShapeType, CameraView } from '../types';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface VoxelShapeComponentProps {
  voxel: Voxel;
  isSelected: boolean;
}

const VoxelShapeComponent: React.FC<VoxelShapeComponentProps> = React.memo(({ voxel, isSelected }) => {
    const { position, color, shape, dimensions } = voxel;
    const commonProps = { position };
    
    const opacity = isSelected ? 0.5 : 1;

    switch (shape) {
        case 'sphere':
            return <Sphere {...commonProps} scale={dimensions}><meshStandardMaterial color={color} transparent={isSelected} opacity={opacity} /></Sphere>;
        case 'cone':
             return <Cone {...commonProps} scale={dimensions}><meshStandardMaterial color={color} transparent={isSelected} opacity={opacity} /></Cone>;
        case 'window':
             return <Box {...commonProps} scale={[dimensions[0] * 1.2, dimensions[1] * 1.2, 0.2]}><meshStandardMaterial color="#3b82f6" transparent opacity={isSelected ? 0.3 : 0.5} /></Box>;
        case 'door':
             return <Box {...commonProps} scale={[0.8, dimensions[1] * 1.5, 0.2]}><meshStandardMaterial color="#964B00" transparent={isSelected} opacity={opacity} /></Box>;
        case 'box':
        default:
            return <Box {...commonProps} scale={dimensions}><meshStandardMaterial color={color} transparent={isSelected} opacity={opacity} /></Box>;
    }
});

interface CursorProps {
    position: [number, number, number];
    isPinching?: boolean;
    editMode?: EditMode;
    isVisible: boolean;
    isGesturing?: boolean;
    shape: VoxelShapeType;
    dimensions: [number, number, number];
    overrideColor?: string;
    lineStartPoint?: [number, number, number] | null;
    selectedVoxel: Voxel | null;
}

const Cursor: React.FC<CursorProps> = ({ position, isPinching, editMode, isVisible, isGesturing, shape, dimensions, overrideColor, lineStartPoint, selectedVoxel }) => {
    const ref = useRef<THREE.Group>(null!);
    
    const getDefaultColor = () => {
        if (editMode === 'add') return isPinching ? '#f87171' : '#4ade80';
        if (editMode === 'line' || editMode === 'rectangle') return lineStartPoint ? '#f59e0b' : (isPinching ? '#f87171' : '#4ade80');
        if (editMode === 'move') return selectedVoxel ? '#f59e0b' : (isPinching ? '#f87171' : '#4ade80');
        return isPinching ? '#4ade80' : '#f87171';
    };

    const color = overrideColor || getDefaultColor();
    const roundedPos: [number, number, number] = [Math.round(position[0]), Math.round(position[1]), Math.round(position[2])];
    const cursorShape = selectedVoxel && editMode === 'move' ? selectedVoxel.shape : shape;
    const cursorDimensions = selectedVoxel && editMode === 'move' ? selectedVoxel.dimensions : dimensions;

    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.position.lerp(new THREE.Vector3(...roundedPos), delta * 20);
            ref.current.visible = isVisible && !isGesturing;
        }
    });
    
    const wireframeMaterial = <meshBasicMaterial color={color} wireframe />;
    const scale: [number, number, number] = [cursorDimensions[0] * 1.05, cursorDimensions[1] * 1.05, cursorDimensions[2] * 1.05];

    return (
        <group ref={ref}>
            {cursorShape === 'box' && <Box scale={scale}>{wireframeMaterial}</Box>}
            {cursorShape === 'sphere' && <Sphere scale={scale}>{wireframeMaterial}</Sphere>}
            {cursorShape === 'cone' && <Cone scale={scale}>{wireframeMaterial}</Cone>}
            {cursorShape === 'window' && <Box scale={[scale[0] * 1.2, scale[1] * 1.2, 0.25]}>{wireframeMaterial}</Box>}
            {cursorShape === 'door' && <Box scale={[0.85, scale[1] * 1.5, 0.25]}>{wireframeMaterial}</Box>}
        </group>
    );
}

const GestureCameraController: React.FC<{rotation: [number, number], zoom: number, pan: [number, number], controlsRef: React.RefObject<OrbitControlsImpl>}> = ({ rotation, zoom, pan, controlsRef }) => {
    const { camera } = useThree();
    const targetPosition = useRef(new THREE.Vector3()).current;
    
    useEffect(() => {
        if(controlsRef.current && (pan[0] !== 0 || pan[1] !== 0)) {
            const panSpeed = 0.01 * zoom;
            controlsRef.current.target.x -= pan[0] * panSpeed;
            controlsRef.current.target.y += pan[1] * panSpeed;
            controlsRef.current.update();
        }
    }, [pan, controlsRef, zoom]);

    useFrame((state, delta) => {
        const target = controlsRef.current ? controlsRef.current.target : new THREE.Vector3(0,0,0);
        const [yaw, pitch] = rotation;
        
        targetPosition.x = target.x + zoom * Math.sin(yaw) * Math.cos(pitch);
        targetPosition.y = target.y + zoom * Math.sin(pitch);
        targetPosition.z = target.z + zoom * Math.cos(yaw) * Math.cos(pitch);
        
        camera.position.lerp(targetPosition, delta * 5);
        camera.lookAt(target);
    });

    return null;
}

const RectanglePreview: React.FC<{start: [number,number,number], end: [number,number,number]}> = ({start, end}) => {
    const [x1, y1, z1] = start.map(p => Math.round(p));
    const [x2, y2, z2] = [Math.round(end[0]), Math.round(end[1]), Math.round(end[2])];

    const center = [(x1+x2)/2, (y1+y2)/2, (z1+z2)/2] as [number,number,number];
    const size = [Math.abs(x1-x2)+1, Math.abs(y1-y2)+1, Math.abs(z1-z2)+1] as [number,number,number];

    return (
        <Box position={center} scale={size}>
            <meshBasicMaterial color="#f59e0b" wireframe />
        </Box>
    )
}

interface VoxelEditorProps {
  voxels: Voxel[];
  activeLayerId: string | null;
  rightCursorPosition: [number, number, number];
  leftCursorPosition: [number, number, number];
  isPinching: boolean;
  editMode: EditMode;
  isGesturing: boolean;
  rightHandDetected: boolean;
  leftHandDetected: boolean;
  cameraRotation: [number, number];
  cameraZoom: number;
  cameraPan: [number, number];
  cameraView: CameraView;
  voxelShape: VoxelShapeType;
  voxelDimensions: [number, number, number];
  lineStartPoint: [number, number, number] | null;
  rectStartPoint: [number, number, number] | null;
  selectedVoxel: Voxel | null;
  onMouseAction: (position: [number, number, number]) => void;
  mouseCursorPosition: [number, number, number] | null;
  setMouseCursorPosition: (pos: [number, number, number] | null) => void;
}

const VoxelEditor: React.FC<VoxelEditorProps> = (props) => {
  const { voxels, activeLayerId, rightCursorPosition, leftCursorPosition, isPinching, editMode, isGesturing, rightHandDetected, leftHandDetected, cameraRotation, cameraZoom, cameraPan, cameraView, voxelShape, voxelDimensions, lineStartPoint, rectStartPoint, selectedVoxel, onMouseAction, mouseCursorPosition, setMouseCursorPosition } = props;
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const isPerspective = cameraView === 'perspective';
  const anyHandDetected = rightHandDetected || leftHandDetected;

  const currentCursorPosition = useMemo(() => {
      return anyHandDetected ? rightCursorPosition : mouseCursorPosition;
  }, [anyHandDetected, rightCursorPosition, mouseCursorPosition]);
  
  return (
    <Canvas 
        camera={{ position: [25, 25, 25], fov: 50 }} 
        style={{ background: '#444455' }}
        onPointerMissed={() => setMouseCursorPosition(null)}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[50, 50, 50]} intensity={2.5} castShadow />
      <OrbitControls ref={orbitControlsRef} makeDefault enabled={!anyHandDetected && isPerspective} />
      
      {anyHandDetected && isPerspective && <GestureCameraController rotation={cameraRotation} zoom={cameraZoom} pan={cameraPan} controlsRef={orbitControlsRef}/>}
      
      <Grid infiniteGrid cellSize={1} sectionSize={5} sectionColor={"#6f6f80"} cellColor={"#5c5c70"} fadeDistance={150} />
      {/* FIX: Moved pointer event handlers from Canvas to this ground-plane mesh to fix type errors. */}
      <mesh 
        name="ground-plane" 
        rotation={[-Math.PI / 2, 0, 0]} 
        visible={false}
        onPointerMove={(e) => {
            if (anyHandDetected) return;
            setMouseCursorPosition([e.point.x, e.point.y + 0.5, e.point.z]);
        }}
        onPointerDown={(e) => {
            if (anyHandDetected || e.button !== 0) return;
            e.stopPropagation(); // Prevent onPointerMissed on canvas from firing.
            onMouseAction([e.point.x, e.point.y + 0.5, e.point.z]);
        }}
      >
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial />
      </mesh>

      {voxels.map((voxel) => (
        <group 
            key={voxel.id} 
            userData={{ voxelId: voxel.id }}
            onPointerDown={(e) => {
                if (anyHandDetected || e.button !== 0) return;
                e.stopPropagation();
                // Only handle voxel clicks in move or remove mode.
                if ((editMode === 'move' || editMode === 'remove') && voxel.layerId === activeLayerId) {
                    onMouseAction(voxel.position);
                }
            }}
        >
            <VoxelShapeComponent voxel={voxel} isSelected={selectedVoxel?.id === voxel.id} />
        </group>
      ))}
      
      {lineStartPoint && currentCursorPosition && (
          <Line points={[lineStartPoint, [Math.round(currentCursorPosition[0]), Math.round(currentCursorPosition[1]), Math.round(currentCursorPosition[2])]]} color="#f59e0b" lineWidth={3} dashed dashScale={5} gapSize={3} />
      )}
       {rectStartPoint && currentCursorPosition && (
          <RectanglePreview start={rectStartPoint} end={currentCursorPosition} />
      )}

      <Cursor position={rightCursorPosition} isPinching={isPinching} editMode={editMode} isVisible={rightHandDetected} isGesturing={isGesturing} shape={voxelShape} dimensions={voxelDimensions} lineStartPoint={lineStartPoint || rectStartPoint} selectedVoxel={selectedVoxel} />
      <Cursor position={leftCursorPosition} isVisible={leftHandDetected && isPerspective} isGesturing={isGesturing} shape={'sphere'} dimensions={[0.7, 0.7, 0.7]} overrideColor="#3b82f6" selectedVoxel={null} />
      
      {mouseCursorPosition && <Cursor position={mouseCursorPosition} isVisible={!anyHandDetected} shape={voxelShape} dimensions={voxelDimensions} editMode={editMode} lineStartPoint={lineStartPoint || rectStartPoint} selectedVoxel={selectedVoxel} />}
    </Canvas>
  );
};

export default VoxelEditor;
