import React, { useState, useEffect, useRef } from 'react';

const PCBViewerApp = () => {
  const [filePath, setFilePath] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [pcbData, setPcbData] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showPathModal, setShowPathModal] = useState(false);

  // Load saved path from memory on component mount
  useEffect(() => {
    const savedPath = localStorage.getItem('pcb_file_path');
    if (savedPath) {
      setFilePath(savedPath);
      validatePath(savedPath, true);
    }
  }, []);

  // Load KiCanvas script
  useEffect(() => {
    const loadKiCanvas = () => {
      if (document.querySelector('script[src*="kicanvas"]')) {
        return;
      }

      const script = document.createElement('script');
      script.src = '/js/kicanvas.js';
      script.async = true;
      script.onload = () => {
        console.log('KiCanvas loaded');
      };
      script.onerror = () => {
        setStatus({ message: 'Failed to load KiCanvas library', type: 'error' });
      };
      document.head.appendChild(script);
    };

    loadKiCanvas();
  }, []);

  const showAlert = (title, message, onConfirm) => {
    const result = window.confirm(`${title}\n\n${message}\n\nWould you like to reload the PCB?`);
    if (result && onConfirm) {
      onConfirm();
    }
  };

  const showStatus = (message, type = 'info') => {
    setStatus({ message, type });
    // Auto-clear status after 5 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        setStatus({ message: '', type: '' });
      }, 5000);
    }
  };

  const validatePath = async (pathToValidate = filePath, silent = false) => {
    if (!pathToValidate.trim()) {
      if (!silent) showStatus('Please enter a file path', 'error');
      return false;
    }

    if (!silent) {
      showStatus('Validating path...', 'info');
      setLoading(true);
    }

    try {
      const response = await fetch('http://localhost:5000/api/validate-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path: pathToValidate })
      });

      const data = await response.json();

      if (data.valid) {
        // Store valid path in localStorage (but don't use localStorage in artifacts)
        // Instead, we'll use a state variable to simulate persistence
        if (!silent) {
          showStatus(
            `✅ Valid PCB file found: ${data.file_info.name} (${formatFileSize(data.file_info.size)})`, 
            'success'
          );
        }
        return true;
      } else {
        if (!silent) {
          showStatus('❌ Invalid file path or not a PCB file', 'error');
        }
        return false;
      }
    } catch (error) {
      if (!silent) {
        showStatus(`Error validating path: ${error.message}`, 'error');
      }
      return false;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadPCB = async () => {
    if (!filePath.trim()) {
      showStatus('Please enter a file path', 'error');
      return;
    }

    showStatus('Loading PCB file...', 'info');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/load-pcb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path: filePath })
      });
      closePCB();
      const data = await response.json();

      if (data.success) {
        setPcbData(data);
        setShowViewer(true);
        setShowPathModal(false);
        showStatus(`✅ PCB loaded successfully`, 'success');
      } else {
        showStatus(`❌ Error: ${data.error}`, 'error');
      }
    } catch (error) {
      showStatus(`❌ Network error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const reloadPCB = async () => {
    if (pcbData) {
        setShowViewer(false);
        setPcbData(null);
        await loadPCB();
    }
  };

  const closePCB = () => {
    setShowViewer(false);
    setPcbData(null);
  };

  const clearAll = () => {
    setFilePath('');
    setStatus({ message: '', type: '' });
    closePCB();
    setShowPathModal(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePathSubmit = async () => {
    const isValid = await validatePath();
    if (isValid) {
      await loadPCB();
    }
  };

  const NavBar = () => (
    <nav className="bg-gray-900 text-white shadow-lg relative z-50">
      <div className="max-w-full mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">🔧 PCB Viewer</h1>
            {pcbData && (
              <span className="text-sm text-gray-300 hidden md:inline">
                {pcbData.filename}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setShowPathModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              Change Path
            </button>
            
            <button
              onClick={() => validatePath()}
              disabled={loading || !filePath}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
            >
              Validate
            </button>
            
            <button
              onClick={loadPCB}
              disabled={loading || !filePath}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Loading...' : showViewer ? 'Reload' : 'Load'}
            </button>
            
            {showViewer && (
              <button
                onClick={closePCB}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
              >
                Close
              </button>
            )}
            
            <button
              onClick={clearAll}
              disabled={loading}
              className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      {status.message && (
        <div className={`px-6 py-2 text-sm border-t ${
          status.type === 'success' ? 'bg-green-800 border-green-700 text-green-100' :
          status.type === 'error' ? 'bg-red-800 border-red-700 text-red-100' :
          'bg-blue-800 border-blue-700 text-blue-100'
        }`}>
          {status.message}
        </div>
      )}
    </nav>
  );

  const PathModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">PCB File Path</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Enter PCB File Path:
            </label>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePathSubmit()}
              placeholder="Enter full path to your .kicad_pcb file (e.g., /path/to/your/board.kicad_pcb)"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm"
              disabled={loading}
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-700 space-y-1 pl-4">
              <li>• Enter the full system path to your .kicad_pcb file</li>
              <li>• The file will be validated automatically</li>
              <li>• WebSocket will monitor for file changes</li>
              <li>• Use the top navigation to control the viewer</li>
            </ul>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowPathModal(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handlePathSubmit}
              disabled={loading || !filePath.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load PCB'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const WelcomeScreen = () => (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-6xl mb-6">🔧</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">PCB Web Viewer</h2>
        <p className="text-gray-600 mb-8">
          Professional PCB file viewer with real-time monitoring and full-screen display.
        </p>
        <button
          onClick={() => setShowPathModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
        >
          Load PCB File
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <NavBar />
      
      {showViewer && pcbData ? (
        <div className="flex-1 bg-white">
          <kicanvas-embed
            src={`http://localhost:5000${pcbData.url}`}
            controls="full"
            style={{ width: '100%', height: '95vh', display: 'block' }}
          />
        </div>
      ) : (
        <WelcomeScreen />
      )}
      
      {/* Path Modal */}
      {showPathModal && <PathModal />}
    </div>
  );
};

export default PCBViewerApp;