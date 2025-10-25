import React, { useState, useEffect } from 'react';
import { vegetableService } from '../lib/supabase';
import './CheckoutCart.css';

const CheckoutCart = ({ sessionId, onCartUpdate }) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadCartItems();
    }
  }, [sessionId]);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const cartItems = await vegetableService.getCheckoutItems(sessionId);
      const cartTotal = await vegetableService.getCartTotal(sessionId);
      
      setItems(cartItems);
      setTotal(cartTotal);
      
      if (onCartUpdate) {
        onCartUpdate(cartItems, cartTotal);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await vegetableService.removeFromCheckout(itemId);
      await loadCartItems();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const clearCart = async () => {
    try {
      await vegetableService.clearCheckout(sessionId);
      await loadCartItems();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="checkout-cart">
        <div className="cart-header">
          <h3>🛒 Checkout Cart</h3>
        </div>
        <div className="cart-loading">
          <div className="spinner"></div>
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-cart">
      <div className="cart-header">
        <h3>🛒 Checkout Cart</h3>
        <span className="item-count">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <div className="empty-cart">
          <p>No items in cart</p>
          <p className="cart-hint">Scan vegetables to add them to your cart</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <h4>🥬 {item.vegetable_name}</h4>
                  <p className="item-weight">
                    Weight: {item.weight_g}g
                    {item.confidence_score && (
                      <span className="confidence">({item.confidence_score}% confidence)</span>
                    )}
                  </p>
                </div>
                <div className="item-pricing">
                  <span className="item-price">₹{item.total_price.toFixed(2)}</span>
                  <button 
                    className="remove-btn"
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="cart-total">
              <div className="total-line">
                <span className="total-label">TOTAL:</span>
                <span className="total-amount">₹{total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="cart-actions">
              <button className="btn btn-clear" onClick={clearCart}>
                🗑️ CLEAR CART
              </button>
              <button className="btn btn-checkout">
                💳 PROCEED TO PAYMENT
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutCart;
