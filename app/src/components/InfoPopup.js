import React from 'react';

import cN from 'classnames';
import Media from 'react-media';

// import { InfoPopup } from "./";

import "../App.scss";
import './pollsView.css';

const InfoPopup = props => {
  const { height, clear } = props;

  return (<>
    <div
      className={ cN('') }
      onClick={ clear }

    >

      <div>
        <span className={ '' } >

        </span>
      </div>
    </div>
  </>)
}

export default InfoPopup;
