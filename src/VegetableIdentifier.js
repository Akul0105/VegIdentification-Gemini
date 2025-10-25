import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { vegetableService } from './lib/supabase';
import QRCodeGenerator from './components/QRCodeGenerator';
import FloatingVeggies from './components/FloatingVeggies';
import { ShimmerButton } from './components/ui/shimmer-button';
import { motion } from 'framer-motion';
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
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [qrData, setQrData] = useState('');

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

  const capturePhoto = async () => {
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
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
          setImage(file);
          setError(null);
          stopCamera();
          
          // Automatically process the image after capture
          setTimeout(() => {
            analyzeImage(file);
          }, 500); // Small delay to ensure image is set
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
      
      // Automatically process the uploaded image
      setTimeout(() => {
        analyzeImage(file);
      }, 500); // Small delay to ensure image is set
    }
  };

  const analyzeImage = async (imageToAnalyze = null) => {
    const imageToUse = imageToAnalyze || image;
    if (!imageToUse) return;

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
        "estimated_weight": "estimated weight in grams based on size and type - be very specific and realistic",
        "weight_confidence": "confidence in weight estimation (low/medium/high)",
        "nutritional_info": "brief nutritional information",
        "storage_tips": "how to store this vegetable"
      }
      
      IMPORTANT: For weight estimation, consider:
      - If it's a single small vegetable (like one tomato), estimate 50-150g
      - If it's a single medium vegetable (like one potato), estimate 100-300g  
      - If it's a single large vegetable (like one cabbage), estimate 500-1500g
      - If it's multiple vegetables in a basket, estimate the total weight of all items
      - Be realistic and consider the actual size visible in the image
      - A basket of potatoes should weigh much more than a single tomato`;

      const imagePart = {
        inlineData: {
          data: await fileToBase64(imageToUse),
          mimeType: imageToUse.type
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
          
          // Try to find matching vegetable in database and calculate price
          try {
            console.log('Looking for vegetable:', parsedResult.vegetable_name);
            const vegetable = await vegetableService.findVegetableByName(parsedResult.vegetable_name);
            console.log('Found vegetable:', vegetable);
            
            if (vegetable) {
              const weightG = parseFloat(parsedResult.estimated_weight) || 0;
              
              // Calculate price manually based on vegetable pricing unit
              let unitPrice = 0;
              let totalPrice = 0;
              
              if (vegetable.pricing_unit === 'per_500g') {
                unitPrice = vegetable.price_per_500g;
                totalPrice = (weightG / 500.0) * unitPrice;
              } else if (vegetable.pricing_unit === 'per_unit') {
                unitPrice = vegetable.price_per_unit;
                totalPrice = unitPrice;
              } else if (vegetable.pricing_unit === 'per_packet') {
                unitPrice = vegetable.price_per_packet;
                totalPrice = unitPrice;
              }
              
              console.log('Manual price calculation:', { 
                vegetable: vegetable.name, 
                pricing_unit: vegetable.pricing_unit,
                weightG, 
                unitPrice, 
                totalPrice,
                price_per_500g: vegetable.price_per_500g,
                price_per_unit: vegetable.price_per_unit,
                price_per_packet: vegetable.price_per_packet
              });
              
              // Add pricing information to result
              parsedResult.database_match = true;
              parsedResult.unit_price = unitPrice;
              parsedResult.total_price = totalPrice;
              parsedResult.vegetable_id = vegetable.id;
            } else {
              console.log('No vegetable found in database for:', parsedResult.vegetable_name);
              parsedResult.database_match = false;
              parsedResult.unit_price = 0;
              parsedResult.total_price = 0;
            }
          } catch (dbError) {
            console.error('Database lookup error:', dbError);
            parsedResult.database_match = false;
            parsedResult.unit_price = 0;
            parsedResult.total_price = 0;
          }
          
          setResult(parsedResult);
        } else {
          setResult({ 
            vegetable_name: "Unknown", 
            description: text,
            estimated_weight: "Unable to estimate",
            confidence: "Unknown",
            database_match: false,
            unit_price: 0,
            total_price: 0
          });
        }
      } catch (parseError) {
        setResult({ 
          vegetable_name: "Analysis Complete", 
          description: text,
          estimated_weight: "See description",
          confidence: "Unknown",
          database_match: false,
          unit_price: 0,
          total_price: 0
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

  const confirmPackaging = () => {
    if (!result || !result.database_match) {
      setError('Cannot confirm: Vegetable not found in database or pricing unavailable');
      return;
    }

    // Generate QR code data
    const qrContent = {
      vegetable: result.vegetable_name,
      weight: result.estimated_weight,
      price: result.total_price,
      timestamp: new Date().toISOString(),
      sessionId: sessionId
    };
    
    setQrData(JSON.stringify(qrContent));
    setShowConfirmation(true);
  };

  const closeConfirmation = () => {
    setShowConfirmation(false);
    setQrData('');
    resetApp();
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
      <FloatingVeggies />
      <div className="container">
        <div className="checkout-header">
          <div className="store-branding">
            <h1 className="store-name">FreshMart</h1>
            <p className="checkout-counter">Checkout Counter #3</p>
          </div>
          <div className="scanner-title">
            <h2>🥬 Autonomous Vegetable Weighing Machine System</h2>
            <p>Automatic vegetable identification and weight-based pricing</p>
          </div>
        </div>
        
        {!image && !showCamera && (
          <div className="main-content">
            <div className="checkout-instructions">
              <motion.div 
                className="instruction-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.h3
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  🥬 How to Use
                </motion.h3>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <p>1. Click "SCAN VEGETABLE" to use the camera</p>
                  <p>2. Position your vegetable on loading page</p>
                  <p>3. System will automatically identify, weigh, and price</p>
                  <p>4. Confirm the price to send to packaging</p>
                </motion.div>
              </motion.div>
            </div>

            <motion.div 
              className="checkout-controls flex gap-6 justify-center flex-wrap mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <ShimmerButton onClick={startCamera} variant="primary">
                🔍 SCAN VEGETABLE
              </ShimmerButton>
              <label className="relative">
                <ShimmerButton variant="secondary">
                  📁 UPLOAD IMAGE
                </ShimmerButton>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden absolute"
                />
              </label>
            </motion.div>
          </div>
        )}

        {showCamera && (
          <motion.div 
            className="scanner-section"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="scanner-container">
              <motion.div 
                className="scanner-header"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3>🔍 Vegetable Scanner Active</h3>
                <p>Position vegetable on loading page</p>
              </motion.div>
              <div className="scanner-viewport">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="scanner-video"
                ></video>
                <div className="scanner-overlay">
                  <div className="scan-line"></div>
                  <div className="scan-corners"></div>
                </div>
              </div>
              <motion.div 
                className="scanner-controls flex gap-4 justify-center flex-wrap mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ShimmerButton
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  variant="success"
                >
                  {cameraReady ? '✅ CAPTURE ITEM' : '⏳ INITIALIZING...'}
                </ShimmerButton>
                <ShimmerButton
                  onClick={stopCamera}
                  variant="danger"
                >
                  ❌ CANCEL SCAN
                </ShimmerButton>
              </motion.div>
              {!cameraReady && (
                <motion.p 
                  className="scanner-status"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Scanner initializing, please wait...
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {image && !loading && !result && (
          <motion.div 
            className="item-preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="preview-container">
              <div className="item-image">
                <img src={URL.createObjectURL(image)} alt="Scanned vegetable" className="preview-image" />
                <motion.div 
                  className="scan-indicator"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  ✓ SCANNED
                </motion.div>
              </div>
              <motion.div 
                className="preview-controls flex gap-4 justify-center flex-wrap mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <ShimmerButton onClick={resetApp} variant="warning">
                  🔄 SCAN ANOTHER ITEM
                </ShimmerButton>
              </motion.div>
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="processing-section">
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>Processing item for checkout...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="error-section">
            <p>❌ {error}</p>
          </div>
        )}

        {result && (
          <div className="receipt-section">
            <div className="receipt-container">
              <div className="receipt-header">
                <h2>🧾 FreshMart Checkout Receipt</h2>
                <div className="receipt-info">
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  <p>Time: {new Date().toLocaleTimeString()}</p>
                  <p>Counter: #3</p>
                </div>
              </div>
              
              <div className="receipt-item">
                <div className="item-details">
                  <h3>🥬 {result.vegetable_name}</h3>
                  <p className="item-description">{result.description}</p>
                </div>
                
                <div className="item-pricing">
                  <div className="weight-info">
                    <span className="weight-label">Weight:</span>
                    <span className="weight-value">{result.estimated_weight}</span>
                    <span className="weight-confidence">({result.weight_confidence})</span>
                  </div>
                  
                  {result.database_match ? (
                    <>
                      <div className="price-info">
                        <span className="price-label">Unit Price:</span>
                        <span className="price-value">Rs {result.unit_price.toFixed(2)}</span>
                      </div>
                      
                      <div className="total-info">
                        <span className="total-label">TOTAL:</span>
                        <span className="total-value">Rs {result.total_price.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="price-unavailable">
                      <span className="unavailable-text">⚠️ Pricing not available for this vegetable</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="receipt-footer">
                <motion.div 
                  className="receipt-actions flex gap-4 justify-center flex-wrap"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {result.database_match ? (
                    <ShimmerButton onClick={confirmPackaging} variant="success" className="flex-1 min-w-[200px]">
                      ✅ CONFIRM & SEND TO PACKAGING
                    </ShimmerButton>
                  ) : (
                    <ShimmerButton disabled className="flex-1 min-w-[200px]">
                      ❌ PRICING NOT AVAILABLE
                    </ShimmerButton>
                  )}
                  <ShimmerButton onClick={resetApp} variant="warning" className="flex-1 min-w-[180px]">
                    🔄 SCAN ANOTHER ITEM
                  </ShimmerButton>
                </motion.div>
                
                {result.nutritional_info && (
                  <div className="nutrition-info">
                    <h4>🥗 Nutritional Information</h4>
                    <p>{result.nutritional_info}</p>
                  </div>
                )}
                
                {result.storage_tips && (
                  <div className="storage-info">
                    <h4>🏠 Storage Tips</h4>
                    <p>{result.storage_tips}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal with QR Code */}
        {showConfirmation && result && (
          <div className="confirmation-modal">
            <div className="confirmation-container">
              <div className="confirmation-header">
                <h2>✅ ITEM SENT TO PACKAGING</h2>
                <p>Your vegetable has been processed successfully!</p>
              </div>
              
              <div className="confirmation-details">
                <div className="item-info">
                  <h3>🥬 {result.vegetable_name}</h3>
                  <p><strong>Weight:</strong> {result.estimated_weight}</p>
                  <p><strong>Price:</strong> Rs {result.total_price.toFixed(2)}</p>
                  <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
                </div>
                
                <div className="qr-section">
                  <h4>📱 Scan QR Code</h4>
                  <QRCodeGenerator data={qrData} size={200} />
                </div>
              </div>
              
              <motion.div 
                className="confirmation-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <ShimmerButton onClick={closeConfirmation} variant="success" className="text-xl px-12 py-5">
                  ✅ SCAN NEXT ITEM
                </ShimmerButton>
              </motion.div>
            </div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default VegetableIdentifier;
