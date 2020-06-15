import React, { useState } from 'react';

import cN from 'classnames';

import { getDeets } from "../Web3/accessChain";

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

const AdminLogger = props => {
  // const {
  //   NETWORK_ID, implementationAddress, unImplementedAddress,
  //   ProxyAddress, PollAddress, ValidatorAddress,
  //   ProxyABI, PollABI, ValidatorABI,
  //   ProxyInstance, PollInstance, ValidatorInstance,
  //   IMPLEMENTATION_ABI, IMPLEMENTATION_ADDRESS, IMPLEMENTATION_INSTANCE,
  // } = getDeets();

  const [deets, setDeets]= useState({});

  const { OWN_ADDRESS } = props;
  return (
    <div className={'admin-logger'}>
     {[
       [deets.NETWORK_ID,'NETWORK_ID'],
       [deets.OWN_ADDRESS,'OWN_ADDRESS'],
       [deets.IMPLEMENTATION_ABI,'IMPLEMENTATION_ABI'],
       [deets.IMPLEMENTATION_INSTANCE,'IMPLEMENTATION_INSTANCE'],
       [,''],
     ].map (constant=>
        <button
          type="button"
          key = { constant[1] }
          onClick = {()=>{
            if (!Object.keys(deets).length)
              setDeets(getDeets());
            console.log(constant[1],constant[0] || 'Press it again'); }}
        >
          { constant[1] }{ constant[0] && '😃' }
        </button>
      )}
    </div>
  )
}

export default AdminLogger;
