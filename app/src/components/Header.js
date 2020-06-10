import React from 'react';

import cN from 'classnames';

// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";

import "../App.scss";
import './checkInView.css';

const showtimeify = text=>
  text ? `[${text.replace(/ /g,'_')}]` : text ;

const Header = props => {

  return (
    <div className={'header'}>
      <a href={ props.pollUrl || '#' }>
        <h1 className="align-centre" >
          { showtimeify(props.pollName) }
        </h1>
      </a>

      <div className="bar-horiz" >
      </div>

      <div>
        <span className={ cN(props.live && 'live', 'align-centre') } >
          LIVE!
        </span>
      </div>
    </div>
  )
}

export default Header;
