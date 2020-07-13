import React, { useState, useEffect } from 'react';

import { ConnectionError } from 'web3';
import cN from 'classnames';
import Media from 'react-media';

import FormModal from "./FormModal";
import AddPollInfoField from "./AddPollInfoField";
import LogoBottom from "./LogoBottom";
// import {  } from "./";

import { connectToWeb3, refetchOwnAddress, getDeets, setOwnAddyforAuthWeb3,
  getImplementationFunctions, getImplementationEvents,
  callTransaction, sendTransaction, getFromStorage,
  myAccounts, } from "../Web3/accessChain";

import '../App.scss';
import './checkInView.css';
import './modalView.css';
import './stakingView.css';

import { defaultPoll } from '../constants/constants.js';

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

const StakeApp = props => {
  const { pollUrl } = props;

  const [ownAddy, setOwnAddy] = useState(null);
  const [popupView, setPopupView] = useState(null);
  const [modalView, setModalView] = useState(null);
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


  const clearSelf = ()=> {
    console.log('cleared form');
    setNewPollUrl(null);
    setModalView(null);
    ['repStake', 'venueContrib', 'confirmBefore']
      .forEach(field=>{ setFormFields[field]('') });
  }

  const dontChange = ()=>{}

  const handleInput = field=> ev=> {
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
      repStake : formFields.repStake,
      beneficiary : ownAddy,
      // availability : toTuple(formFields.availability.map(toTime)),
      // confirmBefore : formFields.confirmBefore,
    }

    console.log(args);
    return sendTransaction('addUnboundedStake', args)
      .then((resp)=>{
        console.log(`addUnboundedStake`, resp);
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
              <div className=""><span className="">Stake some rep so you can choose times on a Lunchcoin poll</span></div>

              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
                textStyle = "modal-form-text__on-light-bg"
              >
                { `Staker:` }
                { null }
                <input
                  id="staker"
                  type="text"
                  size={ 45}
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
                  id='new-poll-url-(modal)'
                  type="text"
                  size={31}
                  defaultValue={ newPollUrl }
                  onChange={ handleInput('repStake') }
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
                  defaultValue={ '1.0' }
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
                      setModalView('Success. All is aces');
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
      </>

    : <div className="huuuge">
        { modalView }
      </div>


  )
}

export default StakeApp;
