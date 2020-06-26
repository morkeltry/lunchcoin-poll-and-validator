import React from 'react';

import cN from 'classnames';
import Media from 'react-media';

// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";

import "../App.scss";
import './checkInView.css'
import './burger.css';

const showtimeify = text=>
  text ? `[${text.replace(/ /g,'_')}]` : text ;

const Burger = props => {
  const { burger } = props;

  return (
    <div className={ cN('burger', !props.show&&'hidden') }>
      { props.expand &&
        <div className="burger-container" >
          { Object.keys(props.menuItems).map(key=>(
            <div
              key={ key }
              className="burger-menu-item"
              onClick={ props.menuItems[key] }
            > { key } </div>
          )) }
        </div>
      }
      <div className={ cN('burger-container') }
        onClick={ props.toggleExpand }
      >
        { [1,2,3].map(n=> <div
            key={ n+'. Ha Ha Ha.' }
            className={ cN('burger-container') }
            onClick={ props.toggleExpand }
        />) }
      </div>

    </div>
  )
}

export default Burger;
