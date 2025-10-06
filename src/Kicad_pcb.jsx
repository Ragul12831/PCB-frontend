import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Upload, Eye, Layers, RotateCcw, Slice } from 'lucide-react';

const KiCadPCBViewer = () => {
  const [file, setFile] = useState(null);
  const [viewMode, setViewMode] = useState('isometric');
  const [slicePosition, setSlicePosition] = useState(50);
  const [showSlicing, setShowSlicing] = useState(false);
  const [pcbData, setPcbData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const pcbGroupRef = useRef(null);
  const animationIdRef = useRef(null);

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      backgroundColor: '#2d2d2d',
      borderBottom: '1px solid #404040'
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      margin: 0
    },
    uploadContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    uploadButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      border: 'none',
      fontSize: '14px',
      transition: 'background-color 0.2s'
    },
    uploadButtonHover: {
      backgroundColor: '#1d4ed8'
    },
    hiddenInput: {
      display: 'none'
    },
    fileName: {
      fontSize: '14px',
      color: '#d1d5db'
    },
    mainContent: {
      display: 'flex',
      flex: 1
    },
    sidebar: {
      width: '256px',
      backgroundColor: '#2d2d2d',
      padding: '16px',
      borderRight: '1px solid #404040',
      overflowY: 'auto'
    },
    section: {
      marginBottom: '24px'
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '12px',
      color: '#f3f4f6'
    },
    buttonGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s',
      width: '100%',
      textAlign: 'left'
    },
    buttonActive: {
      backgroundColor: '#2563eb',
      color: 'white'
    },
    buttonInactive: {
      backgroundColor: '#374151',
      color: '#d1d5db'
    },
    buttonInactiveHover: {
      backgroundColor: '#4b5563'
    },
    slicingHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px'
    },
    toggleButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'background-color 0.2s'
    },
    toggleActive: {
      backgroundColor: '#16a34a',
      color: 'white'
    },
    toggleInactive: {
      backgroundColor: '#374151',
      color: '#d1d5db'
    },
    sliderContainer: {
      marginTop: '8px'
    },
    sliderLabel: {
      display: 'block',
      fontSize: '12px',
      color: '#9ca3af',
      marginBottom: '4px'
    },
    slider: {
      width: '100%',
      height: '4px',
      borderRadius: '2px',
      background: '#374151',
      outline: 'none',
      cursor: 'pointer'
    },
    layerList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    layerItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px'
    },
    layerColor: {
      width: '12px',
      height: '12px',
      borderRadius: '2px'
    },
    viewer: {
      flex: 1,
      position: 'relative'
    },
    loading: {
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(26, 26, 26, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10
    },
    loadingContent: {
      textAlign: 'center'
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid #374151',
      borderTop: '4px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px',
      margin: '0 auto 16px auto'
    },
    canvas: {
      width: '100%',
      height: '100%',
      minHeight: '400px'
    },
    placeholder: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280'
    },
    placeholderContent: {
      textAlign: 'center'
    },
    placeholderIcon: {
      margin: '0 auto 16px auto',
      opacity: 0.5
    }
  };

  // Add CSS animation for spinner
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    
    if (viewMode === 'isometric') {
      camera.position.set(10, 10, 10);
    } else {
      camera.position.set(0, 0, 20);
    }
    
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(-10, -10, 10);
    scene.add(pointLight);

    // Controls (basic mouse interaction)
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseDown = (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (event) => {
      if (!isMouseDown || !pcbGroupRef.current) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      pcbGroupRef.current.rotation.y += deltaX * 0.01;
      pcbGroupRef.current.rotation.x += deltaY * 0.01;

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event) => {
      const scale = event.deltaY > 0 ? 0.9 : 1.1;
      camera.position.multiplyScalar(scale);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel);

    mountRef.current.appendChild(renderer.domElement);

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [viewMode]);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  }, []);

  // Parse KiCad PCB file (simplified parser)
  const parseKiCadFile = async (fileContent) => {
    setIsLoading(true);
    
    // Simulate parsing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // This is a simplified representation - real KiCad parsing would be much more complex
    const mockPcbData = {
      layers: [
        { name: 'Top Copper', color: 0x00ff00, thickness: 0.035, z: 1.0 },
        { name: 'Dielectric', color: 0x8b4513, thickness: 0.2, z: 0.5 },
        { name: 'Bottom Copper', color: 0x00aa00, thickness: 0.035, z: 0.0 },
        { name: 'Solder Mask', color: 0x0066cc, thickness: 0.02, z: 1.1 }
      ],
      components: [
        { x: 2, y: 2, z: 1.2, width: 1, height: 0.5, depth: 0.3 },
        { x: -2, y: 1, z: 1.2, width: 0.8, height: 0.8, depth: 0.4 },
        { x: 0, y: -2, z: 1.2, width: 1.5, height: 0.6, depth: 0.2 }
      ],
      traces: [
        { points: [[0, 0], [2, 2], [4, 1]], layer: 0, width: 0.1 },
        { points: [[-1, -1], [1, 1], [3, -1]], layer: 2, width: 0.15 }
      ],
      boardOutline: [
        [-5, -3], [5, -3], [5, 3], [-5, 3], [-5, -3]
      ]
    };
    
    setPcbData(mockPcbData);
    setIsLoading(false);
    return mockPcbData;
  };

  // Create 3D PCB visualization
  const createPCBVisualization = useCallback((data) => {
    if (!sceneRef.current || !data) return;

    // Clear existing PCB
    if (pcbGroupRef.current) {
      sceneRef.current.remove(pcbGroupRef.current);
    }

    const pcbGroup = new THREE.Group();
    pcbGroupRef.current = pcbGroup;

    // Create layers
    data.layers.forEach((layer, index) => {
      const geometry = new THREE.BoxGeometry(10, 6, layer.thickness);
      const material = new THREE.MeshLambertMaterial({ 
        color: layer.color,
        transparent: viewMode === 'layered',
        opacity: viewMode === 'layered' ? 0.7 : 1.0
      });
      
      const layerMesh = new THREE.Mesh(geometry, material);
      layerMesh.position.z = layer.z;
      layerMesh.name = `layer-${index}`;
      
      // Apply slicing if enabled
      if (showSlicing) {
        const sliceY = (slicePosition / 100) * 6 - 3;
        if (layerMesh.position.y > sliceY) {
          layerMesh.visible = false;
        }
      }
      
      pcbGroup.add(layerMesh);
    });

    // Create components
    data.components.forEach((comp, index) => {
      const geometry = new THREE.BoxGeometry(comp.width, comp.height, comp.depth);
      const material = new THREE.MeshLambertMaterial({ color: 0x333333 });
      const compMesh = new THREE.Mesh(geometry, material);
      
      compMesh.position.set(comp.x, comp.y, comp.z);
      compMesh.name = `component-${index}`;
      
      if (showSlicing) {
        const sliceY = (slicePosition / 100) * 6 - 3;
        if (compMesh.position.y > sliceY) {
          compMesh.visible = false;
        }
      }
      
      pcbGroup.add(compMesh);
    });

    // Create traces
    data.traces.forEach((trace, index) => {
      const points = trace.points.map(p => new THREE.Vector3(p[0], p[1], data.layers[trace.layer].z + 0.001));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
      const line = new THREE.Line(geometry, material);
      line.name = `trace-${index}`;
      
      if (showSlicing) {
        const sliceY = (slicePosition / 100) * 6 - 3;
        const visiblePoints = points.filter(p => p.y <= sliceY);
        if (visiblePoints.length < 2) {
          line.visible = false;
        }
      }
      
      pcbGroup.add(line);
    });

    // Position based on view mode
    if (viewMode === 'layered') {
      // Spread layers vertically for better visualization
      pcbGroup.children.forEach((child, index) => {
        if (child.name.startsWith('layer-')) {
          const layerIndex = parseInt(child.name.split('-')[1]);
          child.position.z = layerIndex * 0.5;
        }
      });
    }

    sceneRef.current.add(pcbGroup);
  }, [viewMode, showSlicing, slicePosition]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile || !uploadedFile.name.endsWith('.kicad_pcb')) {
      alert('Please select a valid .kicad_pcb file');
      return;
    }

    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const parsedData = await parseKiCadFile(content);
      createPCBVisualization(parsedData);
    };
    reader.readAsText(uploadedFile);
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    
    if (cameraRef.current) {
      if (mode === 'isometric') {
        cameraRef.current.position.set(10, 10, 10);
      } else {
        cameraRef.current.position.set(0, 0, 20);
      }
      cameraRef.current.lookAt(0, 0, 0);
    }
    
    if (pcbData) {
      createPCBVisualization(pcbData);
    }
  };

  // Handle slicing
  const handleSliceChange = (value) => {
    setSlicePosition(value);
    if (pcbData) {
      createPCBVisualization(pcbData);
    }
  };

  // Reset camera
  const resetCamera = () => {
    if (cameraRef.current && pcbGroupRef.current) {
      if (viewMode === 'isometric') {
        cameraRef.current.position.set(10, 10, 10);
      } else {
        cameraRef.current.position.set(0, 0, 20);
      }
      cameraRef.current.lookAt(0, 0, 0);
      pcbGroupRef.current.rotation.set(0, 0, 0);
    }
  };

  // Initialize scene on mount
  useEffect(() => {
    const cleanup = initScene();
    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (cleanup) cleanup();
    };
  }, [initScene, animate]);

  // Update visualization when view mode or slicing changes
  useEffect(() => {
    if (pcbData) {
      createPCBVisualization(pcbData);
    }
  }, [createPCBVisualization, pcbData]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>KiCad PCB 3D Viewer</h1>
        
        {/* File Upload */}
        <div style={styles.uploadContainer}>
          <label 
            style={styles.uploadButton}
            onMouseOver={(e) => e.target.style.backgroundColor = styles.uploadButtonHover.backgroundColor}
            onMouseOut={(e) => e.target.style.backgroundColor = styles.uploadButton.backgroundColor}
          >
            <Upload size={16} />
            Upload PCB File
            <input
              type="file"
              accept=".kicad_pcb"
              onChange={handleFileUpload}
              style={styles.hiddenInput}
            />
          </label>
          
          {file && (
            <span style={styles.fileName}>
              {file.name}
            </span>
          )}
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Sidebar Controls */}
        <div style={styles.sidebar}>
          {/* View Mode Selection */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>View Mode</h3>
            <div style={styles.buttonGroup}>
              <button
                onClick={() => handleViewModeChange('isometric')}
                style={{
                  ...styles.button,
                  ...(viewMode === 'isometric' ? styles.buttonActive : styles.buttonInactive)
                }}
                onMouseOver={(e) => {
                  if (viewMode !== 'isometric') {
                    e.target.style.backgroundColor = styles.buttonInactiveHover.backgroundColor;
                  }
                }}
                onMouseOut={(e) => {
                  if (viewMode !== 'isometric') {
                    e.target.style.backgroundColor = styles.buttonInactive.backgroundColor;
                  }
                }}
              >
                <Eye size={16} />
                Isometric View
              </button>
              
              <button
                onClick={() => handleViewModeChange('layered')}
                style={{
                  ...styles.button,
                  ...(viewMode === 'layered' ? styles.buttonActive : styles.buttonInactive)
                }}
                onMouseOver={(e) => {
                  if (viewMode !== 'layered') {
                    e.target.style.backgroundColor = styles.buttonInactiveHover.backgroundColor;
                  }
                }}
                onMouseOut={(e) => {
                  if (viewMode !== 'layered') {
                    e.target.style.backgroundColor = styles.buttonInactive.backgroundColor;
                  }
                }}
              >
                <Layers size={16} />
                Layered View
              </button>
            </div>
          </div>

          {/* Slicing Controls */}
          {pcbData && (
            <div style={styles.section}>
              <div style={styles.slicingHeader}>
                <h3 style={styles.sectionTitle}>Slicing</h3>
                <button
                  onClick={() => setShowSlicing(!showSlicing)}
                  style={{
                    ...styles.toggleButton,
                    ...(showSlicing ? styles.toggleActive : styles.toggleInactive)
                  }}
                >
                  <Slice size={12} />
                  {showSlicing ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {showSlicing && (
                <div style={styles.sliderContainer}>
                  <label style={styles.sliderLabel}>
                    Slice Position: {slicePosition}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={slicePosition}
                    onChange={(e) => handleSliceChange(parseInt(e.target.value))}
                    style={styles.slider}
                  />
                </div>
              )}
            </div>
          )}

          {/* Camera Controls */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Camera</h3>
            <button
              onClick={resetCamera}
              style={{...styles.button, ...styles.buttonInactive}}
              onMouseOver={(e) => e.target.style.backgroundColor = styles.buttonInactiveHover.backgroundColor}
              onMouseOut={(e) => e.target.style.backgroundColor = styles.buttonInactive.backgroundColor}
            >
              <RotateCcw size={16} />
              Reset View
            </button>
          </div>

          {/* Layer Information */}
          {pcbData && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Layers</h3>
              <div style={styles.layerList}>
                {pcbData.layers.map((layer, index) => (
                  <div key={index} style={styles.layerItem}>
                    <div 
                      style={{
                        ...styles.layerColor,
                        backgroundColor: `#${layer.color.toString(16).padStart(6, '0')}`
                      }}
                    />
                    <span>{layer.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3D Viewer */}
        <div style={styles.viewer}>
          {isLoading && (
            <div style={styles.loading}>
              <div style={styles.loadingContent}>
                <div style={styles.spinner}></div>
                <p>Parsing KiCad file...</p>
              </div>
            </div>
          )}
          
          <div
            ref={mountRef}
            style={styles.canvas}
          />
          
          {!file && (
            <div style={styles.placeholder}>
              <div style={styles.placeholderContent}>
                <div style={styles.placeholderIcon}>
                  <Upload size={48} />
                </div>
                <p>Upload a .kicad_pcb file to view in 3D</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KiCadPCBViewer;