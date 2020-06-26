import React from 'react';

import cN from 'classnames';
import Media from 'react-media';

import Burger from "./Burger";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";

import "../App.scss";
import './checkInView.css';

const showtimeify = text=>
  text ? `[${text.replace(/ /g,'_')}]` : text ;

const asUrl = url=>
  url.match(/https?:\/\//)
  ? url
  : `https://${url}` ;

const Header = props => {
  // let { narrowBreak } = props;
  const { burger, pollUrl, pollName } = props;

  return (<>
    <div className={ cN('header') }>
      <a href={ asUrl(pollUrl) || '#' }>
        <Media queries={{ small: "(max-width: 599px)" }}>
          {matches =>
            matches.small
              ? <h1 className="align-centre narrow-break" >
                  { showtimeify(pollName) }
                </h1>
              : <h1 className="align-centre" >
                  { showtimeify(pollName) }
                </h1>
          }
        </Media>
      </a>
      <div className="bar-horiz" >
      </div>

      <Burger
        show={ true }
        expand={ burger.expand }
        toggleExpand= { ()=>{ burger.setBurgerView(!props.expand); }}
        menuItems= { burger.menuItems }
      />

      <div>
        <span className={ cN(props.live && 'live', 'align-centre') } >
          LIVE!
        </span>
      </div>
    </div>
  </>)
}

export default Header;
