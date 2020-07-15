import React, { useState, useEffect } from 'react';

import { ConnectionError } from 'web3';
import cN from 'classnames';
import Media from 'react-media';

import FormModal from "./FormModal";
import AddPollInfoField from "./AddPollInfoField";
import Toast from "./Toast";
import LogoBottom from "./LogoBottom";
// import {  } from "./";

import { connectToWeb3, refetchOwnAddress, getDeets, setOwnAddyforAuthWeb3,
  getImplementationFunctions, getImplementationEvents, runConstructorManuallyFfs,
  callTransaction, sendTransaction, getFromStorage,
  myAccounts, } from '../Web3/accessChain';
import { eventToastOutput } from '../helpers/outputFormatting.js';

import '../App.scss';
import './checkInView.css';
import './modalView.css';
import './stakingView.css';

import { defaultPoll, alwaysStakeSomeRep } from '../constants/constants.js';

const showtimeify = text=>
  text ? `[${text.replace(/ /g,'_')}]` : text ;

const asUrl = url=>
  url.match(/https?:\/\//)
  ? url
  : `https://${url}` ;

const toTime = ()=>{

}

const toTuple = ()=>{

}

let toastClearer;

const StakeApp = props => {
  const { pollUrl } = props;

  const [ownAddy, setOwnAddy] = useState(null);
  const [caughtEvents, setCaughtEvents] = useState([]);
  const [popupView, setPopupView] = useState(null);
  const [modalView, setModalView] = useState(null);
  const [toastView, setToastViewRaw] = useState(null);
  const [newPollUrl, setNewPollUrl] = useState(defaultPoll);
  const formFields = {};
  const setFormFields = {};
  [formFields.repStake, setFormFields.repStake] = useState('1.0');
  [formFields.venueContrib, setFormFields.venueContrib] = useState('0');
  [formFields.availability, setFormFields.availability] = useState([]);
  [formFields.confirmBefore, setFormFields.confirmBefore] = useState('');
  const [error, setError] = useState(null);
  const [web3Error, setWeb3Error] = useState(null);
  const [noChainError, setNoChainError] = useState(null);


  const setToastView = tV=>{
    setToastViewRaw( tV );
    toastClearer = setTimeout(()=> { setToastViewRaw('') }, toastTimeout(tV));
  }

  const toastTimeout = toastView => 4000;

  // pass this to Toast
  // returns false (ie supress) if any modal is up.
  // the logic is- it's like .filter, not like supress
  const defaultToastFilter = modalView => !Boolean(modalView);

  const catchRelevantEvent = async (result, eventName)=> {
    const { returnValues } = result;
    const ownAddy = await refetchOwnAddress();
    // const ownAddy = getDeets().OWN_ADDRESS;
    console.log(`(according to accessChain:) ${getDeets().OWN_ADDRESS}`);
    console.log(eventName);
    console.log(result.raw);
    console.log(result.returnValues);
    setCaughtEvents( prevState=> prevState.concat(
      { eventName, returnValues, age: Date.now() }
    ));

    if (['disreputableStakerIgnored'].includes(eventName)) {
        setToastView( { event: eventName, ...returnValues } );
    }
    if (['repRefund', 'proofsWindowClosed', 'venuePotDisbursed'].includes(eventName)) {
      if (Object.values(returnValues).includes(ownAddy)) {
        // const { } = result.returnValues;
        setToastView( { event: eventName, ...returnValues } );
      } else {
        console.log(`toast not set, ${returnValues.to} || ${returnValues.staker}!=${ownAddy}`);
      }
    }

  }

  const chainEventListeners = {

    // proofUpdated: {
    //
    // },
    // proofsWindowClosed: {
    //
    // },
    // refundFail: {
    //
    // },

    repRefund: (result, eventName)=> {
      catchRelevantEvent(result, eventName);
      if (!ownAddy || ownAddy.length<42) {
        console.log(`Caught rep event, but it looks like state has reverted to inital value:/ ownAddress=${ownAddy}, retrieved from state again=${'showOwnAddy()'}. Refetching from web3.`);
        refetchOwnAddress().then(ownAddy => {
          console.log('\n\nrefetchOwnAddress SUCEEDED\n\n');
          fetchRep(ownAddy)
            .then (response=> {
              setToastView( { event: 'Rep refunded', response } );
            });
        })
      } else
      fetchRep();
    },
    venuePotDisbursed: catchRelevantEvent,

  }

  const fetchRep = (staker = ownAddy )=> new Promise((resolve, reject)=> {
    console.log('ownAddy',ownAddy,'getRep', {staker});
    callTransaction('getRep', {staker})
      .then(resolve)
      .catch(err=>{ console.log(`getRep failed`, err); reject(err); });
  })


  const clearSelf = ()=> {
    console.log('cleared form');
    // setNewPollUrl(null);
    setTimeout (()=>{ setModalView(null) }, 1000);
    ['repStake', 'venueContrib', 'confirmBefore']
      .forEach(field=>{ setFormFields[field]('') });
    setFormFields.repStake('1.0');
  }

  const dontChange = ()=>{}

  const handleInput = field=> ev=> {
    if (field==='pollUrl') {
      let url=ev.target.value;
      setNewPollUrl(url);
    } else
      setFormFields[field](ev.target.value);
  }

  const validPollAddress = url =>
    url.length>=32 && url.startsWith('doodle.com/poll/')

  const validateUrl = async (ev)=> new Promise((resolve, reject)=> {
    // resolve(true);

    let onChainPollExists;
    let url=(ev.target && ev.target.value).replace(/^((https|http):\/\/)/i,'').replace(/^www./i,'')
    if (url!==newPollUrl) {
      // blink();
      ev.target.value=url;
    }

    if (!validPollAddress(url)) {
      reject('URL looks wrong');
      return
    }
    console.log(`oooh- ${url} could be a valid addy`);
  })


// addUnboundedStake ( poll,  repStake,  beneficiary)
// addStake ( poll,  repStake,  beneficiary, TimeRange[]  availability,  confirmBefore)

  const addStake = ()=>{
    const args = {
      poll : newPollUrl,
      repStake : (formFields.repStake || alwaysStakeSomeRep )*1000,
      beneficiary : ownAddy,
      // availability : toTuple(formFields.availability.map(toTime)),
      // confirmBefore : formFields.confirmBefore,
    }

    if (args.repStake==0 && formFields.venueContrib==0) {
      setError ('No stake or contribution set'); // you can choose to set a zero repStake,
    }                                            // but only in order to contirbute to the venue
                                                 // however, the contract will set your stake to zero and fail silently if stakingIsClosed
    if (formFields.repStake == 0) {
      if (formFields.venueContrib == 0) {
        setToastView( { event: 'zeroStakeAttempt' } );
        return Promise.reject({ message: 'zeroStakeAttempt' });
      } else
        setToastView({
          event: 'venuePaidWithNoRepStake',
          venueContrib: formFields.venueContrib,
          beneficiary: (args.beneficiary!==ownAddy) && args.beneficiary
        });
    }

    console.log(args);
    // TODO: wait for the genuine staked event in additional to this conditional and fake event!!
    if (args.repStake>0 || formFields.venueContrib>0)
    return sendTransaction('addUnboundedStake', args)
      .then((resp)=>{
        console.log(`addUnboundedStake suceeded but that doesn't mean it worked! (check other chain calls to find out)`, resp);
        // NB this detects the total stake, NOT whether this stake was successful!
        // TODO: better events in the contract's addStake.
        callTransaction('totalRepStaked', { _poll: args.poll, _staker: ownAddy,})
          .then (rep=> {
            console.log(`Well here's the damn result! :`,rep);
            if (rep>0)
              setToastView({
                event: 'Placed a stake',
                stake: args.repStake,
                totalRepStaked: rep
              });
            else
              setToastView({ event: 'disreputableStakerIgnored' });
              setError ('Wasteman detected');
              return Promise.reject({ message: 'disreputableStakerIgnored' });
          })
      })
      .catch(err=>{ console.log(`addUnboundedStake failed`, err); });

    // sendTransaction('addStake', args)
    //   .then((resp)=>{
    //     console.log(`addStake`, resp);
    //   })
    //   .catch(err=>{ console.log(`addStake failed`, err); });
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
    (!modalView)
      ? <>
        <div className={ cN('doodle-background') }>
          <div className={ cN('background-opacity') }>
            <FormModal
              clearModal= { ()=>{  } }
              position= "relative"
            >
              <div className={ cN("hype-small", "modal-form-text__on-light-bg") }>
                <span className="">Stake some rep so you can choose times on a Lunchcoin poll</span>
              </div>

              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
                textStyle = "modal-form-text__on-light-bg"
              >
                { `Staker:` }
                { null }
                <input
                  id="staker"
                  type="text"
                  size={ 45 }
                  defaultValue={ ownAddy }
                  onChange={ dontChange }
                />
              </AddPollInfoField>

              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
                textStyle = "modal-form-text__on-light-bg"
              >
                { 'Poll URL:'}
                { null }
                <input
                  id='poll-url'
                  type="text"
                  size={31}
                  defaultValue={ newPollUrl }
                  onChange={ handleInput('pollUrl') }
                />
              </AddPollInfoField>

              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
                textStyle = "modal-form-text__on-light-bg"
              >
                { 'Reputation stake:' }
                { 'Stakers must stake an amount of reputation (recommended: 1) to participate in the poll' }
                <input
                  id="minimum-stake"
                  type="text"
                  size={6}
                  defaultValue={ formFields.repStake }
                  onChange={ handleInput('repStake') }
                  onFocus={ null /* ev=>{ warning(ev,`Different polls may require a different amount of reputation to stake on, but there is no reason to stake more reputation than the minimum for the particular poll`); } */ }
                  onSubmit={ ()=>{ let x= x*1000 } }
                />
              </AddPollInfoField>

              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
                textStyle = "modal-form-text__on-light-bg"
              >
                { 'Venue contribution (k TT):' }
                { `If the initiator of a poll set a cost for the venue then, in future versions, stakers must contribute at minimum an
                  equal share of this cost (in TT, based on the minimum number of participants). \n
                   Stakers may choose to contribute more, or to contribute on someone's behalf.\n
                    When the pot is at least equal to the cost, any staker can redistribute the extra between those who paid in.`
                }
                <input
                  id='venue-contrib'
                  type="text"
                  placeholder="(optional)"
                  size={7}
                  onChange={ handleInput('venueContrib') }
                  onSubmit={ ()=>{ let x= x*1000 } }
                />
              </AddPollInfoField>
              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
                textStyle = "modal-form-text__on-light-bg"
              >
                { 'My availability:' }
                { `You can set any number of time periods in which you can commit to attend.\n
                    It only makes sense to choose time periods which encompass event times on the poll,
                    as this is the only way your stake will be locked in for you to count towards the minimum participants.`
                }
                <input
                  id='availability'
                  type="text"
                  placeholder="(optional)"
                  size={7}
                  onChange={ handleInput('availability') }
                  onSubmit={ ()=>{
                     // toTime(x)
                   } }
                />
              </AddPollInfoField>

              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
                textStyle = "modal-form-text__on-light-bg"
              >
                { 'My availability expires:' }
                { `You can set a time after which, if the poll has not reached its minimum number of participants,
                    your reputation stake and any venue contributions will be released to be reclaimed if you choose.\n
                    Until you do reclaim them, they may still be locked until the event time if one is set once the poll reaches its minimum participants.`
                }
                <input
                  id='confirm-before'
                  type="text"
                  placeholder="(optional)"
                  size={7}
                  onChange={ handleInput('confirmBefore') }
                  onSubmit={ ()=>{
                    // toTuple(x.map(toTime))
                  } }
                />
              </AddPollInfoField>

              <button
                className = { cN('modal-button', 'modal-button__form-button') }
                onClick = { ()=> {
                  addStake()
                    .then(()=>{
                      // setModalView('Success. All is aces');
                      clearSelf();
                    })
                    .catch (e=>{
                      console.log(e);
                      // TODO: set error responses
                    })
                } }
              >
                Add my stake
              </button>
            </FormModal>

            <LogoBottom />
          </div>
        </div>

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

      </>

    : <div className="huuuge">
        { modalView }
      </div>


  )
}

export default StakeApp;
