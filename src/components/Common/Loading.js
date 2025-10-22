import React from 'react';

const Loading = ({ text = "Loading..." }) => {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <div className="loading-text">{text}</div>
    </div>
  );
};

export default Loading;