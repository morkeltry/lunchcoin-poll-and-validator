import React, { useState, useEffect } from 'react';

import { ConnectionError } from 'web3';
import cN from 'classnames';
import Media from 'react-media';
import QRCode from 'qrcode-svg';

import { connectToWeb3, refetchOwnAddress, getDeets, setOwnAddyforAuthWeb3,
  getImplementationFunctions, getImplementationEvents, runConstructorManuallyFfs,
  callTransaction, sendTransaction, getFromStorage,
  myAccounts, } from "../Web3/accessChain";
import { eventToastOutput } from '../helpers/outputFormatting.js';

import InfoModal from "./InfoModal";
import Toast from "./Toast";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";
// import {  } from "./";

import "../App.scss";
import './checkInView.css';
import './stakingView.css';
import './modalView.css';
import "./starsView.css";

// import { defaultPoll } from '../constants/constants.js';

let toastClearer;

const MineApp = props => {
  const { x } = props;

  const [ownAddress, setOwnAddy] = useState('');
  const [caughtEvents, setCaughtEvents] = useState([]);
  const [toastView, setToastViewRaw] = useState(null);
  const [btBeacon, setBtBeacon] = useState(true);
  const [automine, setAutomine] = useState(false);
  const [freeTt, setFreeTt] = useState(true);
  const [showQr, setShowQr] = useState(null);
  const [error, setError] = useState(null);
  const [web3Error, setWeb3Error] = useState(null);
  const [noChainError, setNoChainError] = useState(null);

  const setToastView = tV=>{
    setToastViewRaw( tV );
    toastClearer = setTimeout(()=> { setToastViewRaw('') }, toastTimeout(tV));
  }

  const toastTimeout = toastView => 4000;

  const eventId = '16-07-2020';
  let seq = { eventId: 0 };

  const catchRelevantEvent = async (result, eventName)=> {
    const { returnValues } = result;
    const ownAddy = await refetchOwnAddress();
    console.log(result.raw);
    console.log(result.returnValues);
    setCaughtEvents( prevState=> prevState.concat(
      { eventName, returnValues, age: Date.now() }
    ));

    // if ([].includes(eventName)) {
      if (Object.values(returnValues).includes(ownAddy)) {
        // const { } = result.returnValues;
        setToastView( { event: eventName, ...returnValues } );
      } else {
        console.log(`toast not set, ${returnValues.to} || ${returnValues.staker}!=${ownAddy}`);
      }
    // }

  }

  const chainEventListeners = {
  }

  const showtimeify = text=>
    text ? `[${text.replace(/ /g,'_')}]` : text ;

  const asUrl = url=>
    url.match(/https?:\/\//)
    ? url
    : `https://${url}` ;

  const sig = ()=>
    new Array(64)
      .fill()
      .map(()=>Math.floor(Math.random()*16))
      .map(n=>n.toString(16))
      .join() ;

  const qrMine = (miner, eventId)=> {
    const contract = '0xC4750Ad46B884396d367553d7C2ABed1CA675fC5';
    const url = 'thunder://lunchcoin.xyz/authorised-mine';
    const chainString = `${contract}&miner=${miner}&seq${seq.eventId++}`
    return new QRCode(`${url}?contract=${contract}&miner=${miner}&seq${seq.eventId}&sig=${sig(chainString)}`).svg();
  }

  const mine = (miner, eventId, user)=> {
    sendTransaction('anyoneMineRep')
      .then((resp)=>{
        console.log(`anyoneMineRep`, resp);
        callTransaction('getRep', { staker: user })
          .then((resp)=>{
            setToastView({
              event: 'thirdPartyRepMined',
              publicEvent: eventId,
              user,
              newRep: resp
            });
            console.log(`getRep`, resp);
          })
      })
      .catch(err=>{ console.log(`anyoneMineRep failed`, err); });
  }

  useEffect(()=> {
    // getLocalCache();
    connectToWeb3().then(addressObj => {
      // getImplementationEvents({ pollUrl, setWatchers:true }, chainEventListeners );
      if (!addressObj.OWN_ADDRESS)
        console.log(`\n\n\n\nWarning - setOwnAddy(${addressObj.OWN_ADDRESS})\n\n\n\n`);
      return addressObj.OWN_ADDRESS
    }).then(addy=> {
      setOwnAddy(addy);
      // fetchAndUpdate(addy);
    })
      .catch(err=> {
        // we should be catching here: 105: reject (new Error('no web3 provider'));
        console.log('\n\nconnectToWeb3 FAILED\n\n');
        console.log('fetchAndUpdate gave',err);
        if (err.message==='connection not open on send()' || err instanceof ConnectionError)
          setNoChainError(true)
        else {
          setWeb3Error(true);
          setError(err.message);
        }
      })

  }, []);


  return (
    ownAddress===''
      ? <div className={ cN('backstage', 'bg_openair' ) }>
          <div className={ cN('backstage-text', 'huuuge') }>
            Welcome, community star
          </div>
          <div className={ cN('backstage-text', 'main-header') }>
            please log in
          </div>

        </div>

      : <div className={ cN('backstage', 'bg_openair') }>

          <div className={ cN('form-section') }>
            <div className={ cN('form-section__header', 'backstage-text', 'main-header' ) }>
              { 'Welcome' }
            </div>
            <div className={ cN('main-header__sub', 'backstage-text') }>
              { ownAddress }
            </div>
          </div>

          <div className={ cN('form-section') }>
            <div className={ cN('backstage-text') }>
              You have registered to lead the following public events:
            </div>
            {[
              {time:'Mon Jul 13 00:00 - Thu Jul 17 23:59', eventName:'Initial mining event'},
              {time:'Sun Aug 02 18:00 - 22:30', eventName:'ENS auction opening party @ Rotate'},
              {time:'Sun Aug 16 18:00 - 22:30', eventName:'Community Social'},
              {time:'Sun Aug 30 18:00 - 22:30', eventName:'Community Social'},
            ].map( publicEvent=>
                <div className={ cN('section flex-container') } key={ publicEvent.time } >
                  <div className={'', 'backstage-text'}>
                    { publicEvent.time }
                  </div>
                  <div className={'', 'backstage-text'}>
                    { publicEvent.eventName }
                  </div>
                </div>
            )}

          </div>

          <div className={ cN('bar-horiz__thick__padded') }> </div>


          <div className={ cN('') }>
            <div className={ cN('form-section__header', 'backstage-text') }>
              <span className="">Initial mining event</span>
              <span className=""> is live</span>
            </div>

            <div className={ cN('bar-horiz__thick__padded') }> </div>

            <div className={ cN('') }>
              <div className={ cN('form-section__header', 'backstage-text') }>
                BT mining:
              </div>
            </div>

            <div className={ cN('', 'backstage-text') }>
              Bluetooth beacon:{'\u00A0\u00A0'}
              <span
                className={ cN('toggle-button') }
                onClick={ ()=>{ setBtBeacon(!btBeacon) } }
              >
                { `\u00A0${btBeacon ? '\u00A0ON' : 'OFF'}\u00A0\u00A0` }
              </span>
            </div>
            <div className={ cN('', 'backstage-text') }>
              Bluetooth automining:{'\u00A0\u00A0'}
              <span
                className={ cN('toggle-button') }
                onClick={ ()=>{ setAutomine(!automine) } }
              >
                { `\u00A0${automine ? '\u00A0ON' : 'OFF'}\u00A0\u00A0` }
              </span>
            </div>
            <div className={ cN('', 'backstage-text') }>
              Send new users 5TT for tx gas:{'\u00A0\u00A0'}
              <span
                className={ cN('toggle-button') }
                onClick={ ()=>{ setFreeTt(!freeTt) } }
              >
                { `\u00A0${freeTt ? '\u00A0ON' : 'OFF'}\u00A0\u00A0` }
              </span>
            </div>
            <div className={ cN('', 'backstage-text') }>
              Lunchcoin users on bluetooth:
            </div>
            {[
              ownAddress
            ].map (user=>
              <div className={ cN('', 'backstage-text') } key={ user }>
                <span className={ cN('', 'backstage-text') }>{ user }:</span>
                <span className="">
                  <button
                    id= { 'mine ' + user }
                    onClick= { ()=>{ mine(ownAddress, eventId, user); } }
                    className= { cN('primary-button') }
                  >
                    MINE REP
                  </button>
                </span>
              </div>
            )}

          </div>


          <div className={ cN('bar-horiz__thick__padded') }> </div>


          <div className={ cN('') }>
            <div className={ cN('form-section__header', 'backstage-text') }>
              QR mining:
            </div>
            <div className={ cN('backstage-text') }>
              <span className={ cN('', 'backstage-text') }>QR mining uses a QR code for each physically present user</span>
              <span className="">
                <button
                  id= { 'qr-mine' }
                  onClick= { ()=>{ setShowQr(qrMine());  } }
                  className= { cN('') }
                >
                  GENERATE QR CODE
                </button>
              </span>

            </div>

          </div>

          { showQr &&
            <InfoModal
              modal = "qr modal"
              clearModal= { ()=>{ setShowQr(null); } }
              buttonText= "Done"
            >
              <div className="hype">Scan the QR code with the Lunchcoin app to top up your Lunchcoin rep</div>
              <img
                className="qrcode__large"
                src={ `data:image/svg+xml;utf8,${encodeURIComponent(showQr)}` }
              />
            </InfoModal>
          }

        {
        toastView &&
          <Toast
            visible={ ()=>Boolean(toastView) }
            hide={ ()=>{ setToastView(null) } }
          >
            <div className="toast__header">
              { eventToastOutput(toastView).header }
            </div>
            <div className="toast-text">
              { eventToastOutput(toastView).text }
            </div>

          </Toast>
        }

        </div>
  )
}

export default MineApp;
