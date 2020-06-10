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
return props.modalIsForm
  ? <InfoModal {...props} />
  : (
    <div className={'modal'}>
    </div>
    )
}

export default InfoModal;
