import React from 'react';

const TestIndex = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🎉 KikStars Test Page</h1>
      <p>If you can see this, the React app is working correctly!</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => alert('Button works!')}>
          Test Button
        </button>
      </div>
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Build timestamp: {new Date().toISOString()}
      </div>
    </div>
  );
};

export default TestIndex;