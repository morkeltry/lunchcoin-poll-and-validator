import React from 'react';

import cN from 'classnames';

import "../App.scss";
import './checkInView.css';
import './modalView.css';


const Toast = props => {
  const { show, children } = props;
  return (
    <div className={ cN('toast') } >
      { children }
    </div>
)}

export default Toast;
