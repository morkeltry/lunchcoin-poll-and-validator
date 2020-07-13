import React, { useState } from 'react';

import cN from 'classnames';

import "../App.scss";
import './checkInView.css';
import './modalView.css';

const ms=750;

const Dots = props => {
  return new Array((Math.floor(Date.now()/ms))%3)
    .fill()
    .map(x=>'.')
    .join('')
}

export default Dots;
