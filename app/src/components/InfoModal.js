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

const InfoModal = props => {
return (
    <div className={'modal info-modal'}>
      INFO MODAL here yo...
    </div>
  )
}

export default InfoModal;
