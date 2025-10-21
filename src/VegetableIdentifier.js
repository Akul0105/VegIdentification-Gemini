import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './VegetableIdentifier.css';

const VegetableIdentifier = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI('AIzaSyBXlBhkqbivYJDjY9lx4QFSF2uumr56FiQ');

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      setError(null);
      setShowCamera(true);
      
      // Get camera stream with minimal constraints for instant display
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true 
      });
      
      console.log('Camera access granted, setting up video...');
      setStream(mediaStream);
      
      // Set up video immediately
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Set camera ready immediately when stream is set
        setCameraReady(true);
        
        // Force play
        videoRef.current.play().catch(err => {
          console.error('Video play error:', err);
        });
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCameraReady(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Check if video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Video not ready. Please wait a moment and try again.');
        return;
      }
      
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob and create file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
          setImage(file);
          setError(null);
          stopCamera();
        } else {
          setError('Failed to capture photo. Please try again.');
        }
      }, 'image/jpeg', 0.8);
    } else {
      setError('Camera not ready. Please try again.');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      setResult(null);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `Analyze this image of a vegetable and provide the following information in JSON format:
      {
        "vegetable_name": "name of the vegetable",
        "confidence": "confidence percentage (0-100)",
        "description": "brief description of the vegetable",
        "estimated_weight": "estimated weight in grams based on size and type",
        "weight_confidence": "confidence in weight estimation (low/medium/high)",
        "nutritional_info": "brief nutritional information",
        "storage_tips": "how to store this vegetable"
      }
      
      Please be as accurate as possible with the weight estimation based on the apparent size of the vegetable in the image.`;

      const imagePart = {
        inlineData: {
          data: await fileToBase64(image),
          mimeType: image.type
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResult = JSON.parse(jsonMatch[0]);
          setResult(parsedResult);
        } else {
          setResult({ 
            vegetable_name: "Unknown", 
            description: text,
            estimated_weight: "Unable to estimate",
            confidence: "Unknown"
          });
        }
      } catch (parseError) {
        setResult({ 
          vegetable_name: "Analysis Complete", 
          description: text,
          estimated_weight: "See description",
          confidence: "Unknown"
        });
      }
    } catch (err) {
      setError('Failed to analyze image: ' + err.message);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const resetApp = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="vegetable-identifier">
      <div className="container">
        <div className="header">
          <h1 className="title">
            <span className="title-text">🥬 Vegetable Identifier</span>
          </h1>
          <p className="subtitle">
            Take a photo or upload an image to identify vegetables and estimate their weight with AI
          </p>
        </div>
        
        {!image && !showCamera && (
          <div className="main-content">
            <div className="feature-grid">
              <div className="feature-card camera-card">
                <div className="feature-icon">📷</div>
                <h3>AI Camera</h3>
                <p>Take instant photos with your device camera for real-time vegetable identification.</p>
              </div>
              
              <div className="feature-card weight-card">
                <div className="feature-icon">⚖️</div>
                <h3>Weight Estimation</h3>
                <p>Get accurate weight estimates based on AI analysis of your vegetable images.</p>
              </div>
              
              <div className="feature-card analysis-card">
                <div className="feature-icon">✨</div>
                <h3>Smart Analysis</h3>
                <p>Advanced AI powered by Gemini 2.0 Flash for precise vegetable identification.</p>
              </div>
              
              <div className="feature-card nutrition-card">
                <div className="feature-icon">🥗</div>
                <h3>Nutritional Info</h3>
                <p>Get detailed nutritional information and storage tips for your vegetables.</p>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn btn-primary" onClick={startCamera}>
                📷 Take Photo
              </button>
              <label className="btn btn-secondary">
                📁 Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {showCamera && (
          <div className="camera-section">
            <div className="camera-container">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="camera-video"
              ></video>
              <div className="camera-controls">
                <button 
                  className="btn btn-capture" 
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                >
                  {cameraReady ? '📸 Capture' : '⏳ Loading...'}
                </button>
                <button className="btn btn-cancel" onClick={stopCamera}>
                  ❌ Cancel
                </button>
              </div>
              {!cameraReady && (
                <p className="camera-status">Camera is loading, please wait...</p>
              )}
            </div>
          </div>
        )}

        {image && (
          <div className="image-section">
            <div className="image-container">
              <img src={URL.createObjectURL(image)} alt="Selected vegetable" className="preview-image" />
              <div className="image-controls">
                <button 
                  className="btn btn-analyze" 
                  onClick={analyzeImage} 
                  disabled={loading}
                >
                  {loading ? '🔍 Analyzing...' : '🔍 Analyze Vegetable'}
                </button>
                <button className="btn btn-reset" onClick={resetApp}>
                  🔄 Try Another
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-section">
            <div className="spinner"></div>
            <p>Analyzing your vegetable...</p>
          </div>
        )}

        {error && (
          <div className="error-section">
            <p>❌ {error}</p>
          </div>
        )}

        {result && (
          <div className="result-section">
            <div className="result-container">
              <div className="result-header">
                <h2>🥬 {result.vegetable_name}</h2>
                <span className="confidence-badge">{result.confidence}% Confidence</span>
              </div>
              
              <div className="result-grid">
                <div className="result-card weight-card">
                  <h3>📏 Estimated Weight</h3>
                  <p className="weight-value">{result.estimated_weight}</p>
                  <span className="weight-confidence">({result.weight_confidence} confidence)</span>
                </div>
                
                <div className="result-card description-card">
                  <h3>📝 Description</h3>
                  <p>{result.description}</p>
                </div>
                
                {result.nutritional_info && (
                  <div className="result-card nutrition-card">
                    <h3>🥗 Nutritional Info</h3>
                    <p>{result.nutritional_info}</p>
                  </div>
                )}
                
                {result.storage_tips && (
                  <div className="result-card storage-card">
                    <h3>🏠 Storage Tips</h3>
                    <p>{result.storage_tips}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default VegetableIdentifier;
