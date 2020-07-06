import React from 'react';

import cN from 'classnames';
import Media from 'react-media';

import InfoPopup from "./InfoPopup";

import "../App.scss";
import './modalView.css';
import './pollsView.css';

const AddPollInfoField = props => {
  const { clear, children } = props;

  return (<>
    <div className={ cN('') }>
      { children[0] }
      <span className={ cN('') }>
        { children[2] }
      </span>
      <InfoPopup
        clear={ clear }
      />
    </div>
  </>)
}

export default AddPollInfoField;
