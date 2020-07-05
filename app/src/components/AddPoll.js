import React, { useState, useEffect } from 'react';
import cN from 'classnames';

import FormModal from "./FormModal";
import Loading from "./Loading";
import AddPollInfoField from "./AddPollInfoField";

import { connectToWeb3, getImplementationFunctions, getImplementationEvents,
  callTransaction, sendTransaction, getFromStorage,
  myAccounts, } from "../Web3/accessChain";
import { fetchOnlinePoll } from '../helpers/doodleFetchers.js';
import '../App.scss';
import './pollsView.css';


const AddPoll = props=> {
  const { polls, setPolls, setCurrentPoll, addToChoices } = props;

  const fields = ['initiator', 'minStake', 'participants', 'venueCost', 'venuePayer'];

  const [newPollUrl, setNewPollUrl] = useState(null);
  const [pollKnown, setPollKnown] = useState(null);
  const [knownPolls, setKnownPolls] = useState([]);
  const [foundPollName, setFoundPollName] = useState(null);
  const [ownAddy, setOwnAddy] = useState(null);
  const [modalView, setModalViewRaw] = useState(null);
  const [popupView, setPopupView] = useState(null);
  const formFields = {};
  const setFormFields = {};
  [formFields.initiator, setFormFields.initiator] = useState('');
  [formFields.minStake, setFormFields.minStake] = useState('');
  [formFields.participants, setFormFields.participants] = useState('');
  [formFields.venueCost, setFormFields.venueCost] = useState('');
  [formFields.venuePayer, setFormFields.venuePayer] = useState('');

  const defaultPollValues = {
    initiator : '0x0',
    minStake : 1,
    participants : 0,
    venueCost : 0,
    venuePayer : '0x0',
  }
  const setModalView = newState=> {
    if (newState==='new poll')
      fields.forEach (field=>{
        setFormFields[field](defaultPollValues[field]);
      });
    setModalViewRaw(newState)
  }
  const updateDefaults = (addy = ownAddy)=> {
    defaultPollValues.initiator=addy;
    defaultPollValues.venuePayer=addy;
    setFormFields.initiator(addy);
    setFormFields.venuePayer(addy);
  }

  const clearSelf = ()=> {
    setNewPollUrl(null);
    setPollKnown(null);
    setModalView(null);
    ['initiator', 'minStake', 'participants', 'venueCost', 'venuePayer']
      .forEach(field=>{ setFormFields[field]('') });
  }

  const isPending = promise=> {
    let pending=true;
    promise.then(()=>{ pending=false; })
    return pending
  }

  const validateNewPoll = ev=> {

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

    const doodlePollExists = fetchOnlinePoll(url)
      .then (foundPoll=>{
        if (foundPoll) {
          console.log(`Pretending to have found poll ${url} at doodle`);
          setNewPollUrl(url);
          setFoundPollName(foundPoll.name);
          if (!ownAddy) {
            setModalView('fetching chain data')   // maybe this should just be in useEffect :)
            connectToWeb3().then(addressObj => {
              setOwnAddy(addressObj.OWN_ADDRESS);
              updateDefaults(addressObj.OWN_ADDRESS)
              setTimeout(()=>{ if (onChainPollExists instanceof Promise && onChainPollExists.isPending) setModalView('new poll');
                }, 750);   // we'll ping it back off again if the poll turns out to exist ;)
              return addressObj.OWN_ADDRESS;
            })
            .catch (e=>{console.log(e, 'Web3 error, couldnt get own address:/ \n ADD STATE LOGIC FOR THIS CASE! (AddPoll.js)');})
          } else
            return (ownAddy);   // this is not smart - when ownAddy needs to be fetched, doodlePollExists will only return true. So it cannot be relied upon :/
          return true
        } else {
          console.log('Couldnt find poll at doodle');
          reject ('Poll does not exist')
        }
      })
      .catch (e=>'poll may exist online, but if cannot connect, should carry on or no?')

    if (knownPolls.indexOf(url)>-1)
      resolve(url)
    else {
      onChainPollExists = callTransaction('isPoll', {_poll : url })
      onChainPollExists.isPending=true;
      onChainPollExists
        .then(response=>{
          onChainPollExists.isPending=false;
          console.log(response);
          // NB even non existent polls will return a sensible looking (zeroed response object)
          // Use boolean isPoll() once it is migrated
          if (response) {
            // poll already exists on chain
            console.log(`found ${url} on chain`);
            setPollKnown(true);
            setKnownPolls(knownPolls.concat(url));
            clearSelf();
            addToChoices(url);
            resolve (url);   // resolve back to the form - poll is valid and should be added if submit was pressed.
            return true      // return forward to Promise.all, true signifying the poll exists ON CHAIN
          } else {
            // poll doesn't exist - so user should create it.
            console.log(`did NOT find ${url} on chain`);
            setNewPollUrl(url);
            setPollKnown(false);   // !!! this could easily get into a stuck state if fetches overlap - so how to recover?
            setModalView('new poll');
            // ******
            // skip this whole choosing part and pretend the poll is valid and on chain!
            resolve (url);
            console.log(`Resolving ${url} as an on-chain poll even though it is not!!!`);
            // *******
            // V this is what you should really do!
            // resolve (false);

            return false;    // return onwards to Promise.all, which will pull up the modal form
                             // since (irresepctive of doodle) poll is NOT on chain (will be resVals[1]==false)
          }
        })
      console.log('The Promises: ',[ doodlePollExists, onChainPollExists ]);
      Promise.all([ doodlePollExists, onChainPollExists ])
        .then ((resVals)=>{
          console.log('Those Promises again: ',[ doodlePollExists, onChainPollExists ],resVals);
          console.log(`modalView: ${modalView} ${!resVals[1]? 'but that will change ;)' : ''}`);
          if (!resVals[1])
            setModalView('new poll');
          resolve(false);   // resolve back to the form - do nothing as user has further steps before this url is a selectable on-chain poll.
        })
      }

  })

  const dontChange = ()=>{}

  const warning = (ev, warning)=> {
    switch (warning) {
      case `don't change initiator` :
        // do warning
        // ev.target.unfocus()
    }
  }

  const handleInput = field=> ev=> {
    setFormFields[field](ev.target.value);
  }


  const createPoll = ev=> {
    // only required for button type==submit ;)
    // ev.preventDefault();
    console.log('Click!');

    return new Promise((resolve, reject)=>{
      let { initiator, minStake, participants, venueCost, venuePayer } = formFields;
      const _poll = newPollUrl;
      venueCost = Math.floor(venueCost*1000);
      minStake = Math.floor(minStake*1000);
      let _minParticipants=Math.floor(participants);

      console.log({ _initiator:initiator, _minStake:minStake, _minParticipants, _venueCost:venueCost, _venuePayer:venuePayer });

      if (
        (formFields.initiator.substr(0, 2) !== "0x" || formFields.initiator.length !== 42 || formFields.initiator.length === 0)
        || !(formFields.minStake > 0)
        || isNaN(Number(formFields.participants))
        || isNaN(Number(formFields.venueCost))
        || formFields.venuePayer.length && (formFields.venuePayer.substr(0, 2) !== "0x" || formFields.venuePayer.length !== 42)
      )
        reject ('Bad input. Addresses must be addresses, numbers must be numbers (or blank if optional)');
      else
        sendTransaction('createPoll', { _poll, _initiator:initiator, _minStake:minStake, _minParticipants, _venueCost:venueCost, _venuePayer:venuePayer })
        // sendTransaction('createPoll', { initiator, minStake, participants, venueCost, venuePayer })
          .then(success=> {
            resolve()
          })
          .catch(e=>{
            reject('Chain or network error. Please try again.')
          }) ;
    })
  }

  return (
    <>
      <div
        className="polls-list__add-poll"
        onClick={  ()=>{ setPopupView(null); }  }
      >
        <input
          id='new-poll-url'
          type="text"
          size={32}
          placeholder="Enter doodle poll URL, including https://"
          onBlur= { ()=>{ '??' } }
          onChange={ ev=>{
            //debounce
            validateUrl(ev)
              .then(newPollUrl=>{
                // only add to choices in parent components if this poll is on the chain already.
                if (newPollUrl && newPollUrl.length>=32)
                  addToChoices(newPollUrl);
                setPollKnown( knownPolls.indexOf(newPollUrl)>-1 );
              })
          } }
        />
      </div>
        { modalView &&
          ( modalView === 'new poll'
          ? <FormModal
                modal = { modalView }
                clearModal= { ()=>{ setModalView(null) } }
              >
              <div className=""><span className="">Poll: </span><span className="">{ foundPollName || '> __' }</span></div>

              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
              >
                { 'Poll URL:'}
                { null }
                <input
                  id='new-poll-url-(modal)'
                  type="text"
                  size={32}
                  defaultValue={ newPollUrl }
                  onChange={ dontChange }
                />
              </AddPollInfoField>

              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
              >
                { 'Initiator:' }
                { `You will be, according to the blockchain, the initiator of this poll.
                You will be the only person able to change availabile timeslots and venue costs.
                If you change this field to an address which is unavailable or incorrect, nobody will be able to change these fields.
                Recommended : keep this field as ${ ownAddy }` }
                <input
                  id="new-poll-initiator"
                  type="text"
                  size={42}
                  defaultValue={ ownAddy }
                  onChange={ handleInput('initiator') }
                  onFocus={ ev=>{ warning(ev,`don't change initiator`); } }
                />
              </AddPollInfoField>


              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
              >
                { 'Reputation stake:' }
                { 'Stakers must stake an amount of reputation (recommended: 1) to participate in the poll' }
                <input
                  id="minimum-stake"
                  type="text"
                  size={6}
                  defaultValue={ '1.0' }
                  onChange={ handleInput('minStake') }
                  onSubmit={ ()=>{ let x= x*1000 } }
                />
              </AddPollInfoField>

              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
              >
                { 'Minimum stakers:' }
                { 'All reputation stakes and venue deposits will be returned if the minimum of particpants is not reached' }
                <input
                  id='mimimum-participants'
                  type="text"
                  placeholder="5"
                  size={6}
                  onChange={ handleInput('participants') }
                />
              </AddPollInfoField>

              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
              >
                { 'Venue cost (k TT):' }
                { 'Optional: Stakers must deposit (or someone must deposit for them) at minimum an equal share of the venue cost to participate in the poll' }
                <input
                  id='venue-cost'
                  type="text"
                  placeholder="(optional)"
                  size={6}
                  onChange={ handleInput('venueCost') }
                  onSubmit={ ()=>{ let x= x*1000 } }
                />
              </AddPollInfoField>

              <AddPollInfoField
                clear = { ()=>{ setPopupView(null); } }
              >
                { 'Venue payer:' }
                { 'Once the event is over, or all stakers have checked in, the venue cost can be disbursed to you, or another TT holder. You can change this person later' }
                <input
                  id="venue-payer"
                  type="text"
                  size={42}
                  defaultValue={ ownAddy }
                  onChange={ handleInput('venuePayer') }
                />
              </AddPollInfoField>

              <button
                className = { cN('modal-button', 'modal-button__form-button') }
                onClick = { ()=> {
                  createPoll()
                    .then(()=>{
                      setModalView('Success. All is aces');
                      clearSelf();
                    })
                    .catch (e=>{
                      console.log(e);
                      // warn(e) - if this is state based, may as well set it in createPoll
                    })
                } }
              >
                Back poll with Lunchcoin
              </button>
            </FormModal>
          : modalView.startsWith('Success')
            ? <div>{ modalView }</div>
            : <Loading />
          )
        }
    </>
  )
}

export default AddPoll;
