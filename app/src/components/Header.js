import React from 'react';

import cN from 'classnames';
import Media from 'react-media';

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
  // let { narrowBreak } = props;

  return (<>
    <div className={ cN('header') }>
      <a href={ props.pollUrl || '#' }>
        <Media queries={{ small: "(max-width: 599px)" }}>
          {matches =>
            matches.small
              ? <h1 className="align-centre narrow-break" >
                  { showtimeify(props.pollName) }
                </h1>
              : <h1 className="align-centre" >
                  { showtimeify(props.pollName) }
                </h1>
          }
        </Media>
      </a>
      <div className="bar-horiz" >
      </div>

      <div>
        <span className={ cN(props.live && 'live', 'align-centre') } >
          LIVE!
        </span>
      </div>
    </div>
  </>)
}

export default Header;
