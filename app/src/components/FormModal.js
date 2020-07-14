import React from 'react';
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

const showtimeify = text=>
  text ? `[${text.replace(/ /g,'_')}]` : text ;

// Formmodal currently requires Form contents, including submit button to be passed as children
const FormModal = props => {
  const { position, children } = props;
  return (
        <Media queries={{ w320: "(max-width: 479px)" }}>
          { matches =>
            <div
              className={ cN(
                'modal-form',
                matches.w320 && 'modal-form__to-w320',
                (children.length>99) && 'modal__v-squash',
                position==='relative' && 'position-relative-hack '
              ) }
              >
                { children }
                <div>
                </div>
              </div>
          }
        </Media>
  )
}

export default FormModal;
