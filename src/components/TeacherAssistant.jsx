import React, { useEffect, useRef, Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import robotModel from '../assets/teacher-robot.glb?url';
import fallbackImg from '../assets/ai-robot.png';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("3D Canvas Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

const Model = ({ animationName = "Wave" }) => {
    const group = useRef();
    const { nodes, materials, animations } = useGLTF(robotModel);
    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        if (actions && actions[animationName]) {
            actions[animationName].reset().fadeIn(0.5).play();
            return () => actions[animationName].fadeOut(0.5);
        }
    }, [actions, animationName]);

    return (
        <group ref={group} dispose={null} scale={[2, 2, 2]} position={[0, -1.5, 0]}>
            <primitive object={nodes.Bone} />
            <skinnedMesh
                name="Body"
                geometry={nodes.Body.geometry}
                material={materials.Main}
                skeleton={nodes.Body.skeleton}
            />
            <skinnedMesh
                name="Head"
                geometry={nodes.Head.geometry}
                material={materials.Main}
                skeleton={nodes.Head.skeleton}
            />
        </group>
    );
};

const TeacherAssistant = ({ animation = "Wave" }) => {
    const [webglAvailable] = useState(() => {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    });

    const FallbackUI = (
        <div className="mascot-fallback">
            <img src={fallbackImg} alt="AI Assistant" className="floating-illustration" />
        </div>
    );

    if (!webglAvailable) {
        return FallbackUI;
    }

    return (
        <div className="teacher-assistant-container" style={{ width: '100%', height: '100%', cursor: 'pointer', position: 'relative' }}>
            <ErrorBoundary fallback={FallbackUI}>
                <Canvas shadows gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => {
                    gl.setClearColor(new THREE.Color(0x000000), 0);
                }}>
                    <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} castShadow />
                    <Environment preset="city" />
                    <Suspense fallback={null}>
                        <Model animationName={animation} />
                        <ContactShadows opacity={0.4} scale={10} blur={2} far={4} resolution={256} color="#000000" />
                    </Suspense>
                </Canvas>
            </ErrorBoundary>
        </div>
    );
};

export default TeacherAssistant;
