import React, { useState } from 'react';

import cN from 'classnames';

import "../App.scss";
import './checkInView.css';
import './modalView.css';

const Dots = props => {
  const [dots, setDots] = useState (1);

  return '...'
}

export default Dots;
