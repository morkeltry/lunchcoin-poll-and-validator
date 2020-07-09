import React from 'react';

import cN from 'classnames';
import Media from 'react-media';

// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";

import "../App.scss";

const showtimeify = text=>
  text ? `[${text.replace(/ /g,'_')}]` : text ;

const asUrl = url=>
  url.match(/https?:\/\//)
  ? url
  : `https://${url}` ;

const StakeApp = props => {
  const { pollUrl } = props;

  return (<>
    <div className={ cN() }>
      ADD STAKES TO POLL
    </div>
  </>)
}

export default StakeApp;
