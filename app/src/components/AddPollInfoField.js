import React from 'react';

import cN from 'classnames';
import Media from 'react-media';

import InfoPopup from "./InfoPopup";

import "../App.scss";
import './modalView.css';
import './pollsView.css';

const unArray = (maybeArr, idx)=>
  Array.isArray(maybeArr)
  ? maybeArr[idx]
  : maybeArr ;

const AddPollInfoField = props => {
  const { clear, nightView, children } = props;
  let textStyle = props.textStyle || (nightView ? '' : 'modal-form-text__on-light-bg') ;

  return (<>
    <div className={ cN( unArray(textStyle, 0) ) }>
      { children[0] }
      <span className={ cN( unArray(textStyle, 2) ) }>
        { children[2] }
      </span>
      <InfoPopup
        clear={ clear }
      />
    </div>
  </>)
}

export default AddPollInfoField;
