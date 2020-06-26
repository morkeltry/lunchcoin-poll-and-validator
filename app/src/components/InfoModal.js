import React, { useState } from 'react';

import cN from 'classnames';

// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";

import "../App.scss";
import './checkInView.css';
import './modalView.css';

const InfoModal = props => {
  const { modal, clearModal, loading, loadingText, buttonText, children } = props;

  const [tooLongNoResponse, setTooLongNoResponse] = useState(false);
  setTimeout(()=>{ setTooLongNoResponse(true) }, 500);

  return (
    <div className={'modal-info'}>
      <>
      { loading
        ? <div className="modal-info__loading" >
            { loadingText }
          </div>
        : children }
        <button
          className={ cN('modal-button', 'modal-button__info-button') }
          onClick={ clearModal }
          disabled={ loading && !tooLongNoResponse }
        >
          { buttonText }
        </button>
      </>
    </div>
  )
}

export default InfoModal;
