import React, { useState } from 'react';
import Media from 'react-media';

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
      <Media queries={{ w320: "(max-width: 479px)" }}>
        { matches =>
          <div className={ cN(
            'modal-info',
            matches.w320 && 'modal-info__to-w320',  // not a thing
            (children.length>9) && 'modal__v-squash',
          ) }>
            <>
            { loading
              ? <div className="modal-info__loading" >
                  { loadingText }
                </div>
              : children }
              <button
                className={ cN(
                  'modal-button',
                  'modal-button__info-button'

                ) }
                onClick={ clearModal }
                disabled={ loading && !tooLongNoResponse }
              >
                { buttonText }
              </button>
            </>
        </div>
      }
    </Media>
  )
}

export default InfoModal;
