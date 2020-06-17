import React from 'react';
import Button from "react-bootstrap/Button";
import cN from 'classnames';

// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";

import "../App.scss";
import './checkInView.css';

const Section = props => {
  const { buttonText, buttonSuper, buttonStyles, buttonAction,
    buttonDisabled, buttonHidden, sectionHidden,
    error, id,
    children } = props;

  return(
    <div className={ cN(
        'section',
        error && 'error',
        sectionHidden && 'hidden' ) }>
      <div className="full-height section-child-left">
        { children }
      </div>
      <div className= {cN('full-height', 'section-child-right', !buttonSuper && 'vert-align-centre')}>
        <div className="button-super-text">
          { buttonSuper }
        </div>
        <button
          disabled= { buttonDisabled }
          onClick= { buttonAction }
          className= {cN(
            id==='checkin' && 'primary-button',
            buttonDisabled && 'button__disabled',
            buttonHidden && 'hidden'
          )}
        >
          { props.buttonText }
        </button>
      </div>
  </div>
  )
}

export default Section;
