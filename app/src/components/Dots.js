import React, { useState } from 'react';

import cN from 'classnames';

import "../App.scss";
import './checkInView.css';
import './modalView.css';

const Dots = props => {
  const [dots, setDots] = useState (1);

  setInterval(()=>{ setDots(dots%3+1) }, 1250);

  return new Array(dots)
    .fill()
    .map(x=>'.')
    .join('')
}

export default Dots;
