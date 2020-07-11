import React, { useState } from 'react';
import { CSSTransition } from 'react-transition-group';

import cN from 'classnames';

import "../App.scss";
import './checkInView.css';
import './modalView.css';


const Toast = props => {
  const { visible, hide,  children } = props;
  return (
    <CSSTransition
      in={ ()=>Boolean(visible) }
      timeout={3000}
      classNames="toast"
      unmountOnExit
    >
      <div className={ cN('toast') } onClick={ hide } >
        { children }
      </div>
    </CSSTransition>
)}

export default Toast;
