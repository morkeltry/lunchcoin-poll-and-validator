import React from 'react';

import cN from 'classnames';

// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";

import "../App.scss";
import './checkInView.css';
import './modalView.css';

const showtimeify = text=>
  text ? `[${text.replace(/ /g,'_')}]` : text ;

// Formmodal currently requires Form contents, including submit button to be passed as children
const FormModal = props => {
  const { position, children } = props;
  return (
    <div
      className={ cN('modal-form', position==='relative' && 'position-relative-hack ') }
    >
      { children }
      <div>
      </div>
    </div>
  )
}

export default FormModal;
