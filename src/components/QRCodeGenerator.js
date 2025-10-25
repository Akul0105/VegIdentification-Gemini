import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const QRCodeGenerator = ({ data, size = 200 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (data && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        color: {
          dark: '#2c3e50',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('QR Code generation error:', error);
      });
    }
  }, [data, size]);

  return (
    <div className="qr-code-container">
      <canvas ref={canvasRef} className="qr-code"></canvas>
      <p className="qr-label">Scan with your phone</p>
    </div>
  );
};

export default QRCodeGenerator;
