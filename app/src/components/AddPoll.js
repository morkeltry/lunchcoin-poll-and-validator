import React, { useState, useEffect } from 'react';
import cN from 'classnames';

import FormModal from "./FormModal";
import Loading from "./Loading";

import { connectToWeb3, getImplementationFunctions, getImplementationEvents,
  callTransaction, sendTransaction, getFromStorage,
  myAccounts, } from "../Web3/accessChain";
import { fetchOnlinePoll } from '../helpers/doodleFetchers.js';
import '../App.scss';
import './pollsView.css';

const AddPoll = props=> {
  const { polls, setPolls, setCurrentPoll, add } = props;

  const [newPollUrl, setNewPollUrl] = useState(null);
  const [pollKnown, setPollKnown] = useState(null);
  const [knownPolls, setKnownPolls] = useState([]);
  const [foundPollName, setFoundPollName] = useState(null);
  const [ownAddy, setOwnAddy] = useState(null);
  const [modalView, setModalView] = useState(null);
  const formFields = {};
  const setFormFields = {};
  [formFields.initiator, setFormFields.initiator] = useState('');
  [formFields.minStake, setFormFields.minStake] = useState('');
  [formFields.participants, setFormFields.participants] = useState('');
  [formFields.venueCost, setFormFields.venueCost] = useState('');
  [formFields.venuePayer, setFormFields.venuePayer] = useState('');

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
    url.length>=31 && url.startsWith('doodle.com/poll/')

  const validateUrl = async (ev)=> new Promise((resolve, reject)=> {
    // resolve(true);

    let onChainPollExists;
    let url=(ev.target && ev.target.value).replace(/^((https|http):\/\/)/i,'').replace(/^www./i,'')
    if (url!==newPollUrl) {
      // blink();
      ev.target.value=url;
    }

    if (!validPollAddress(url)) {
      resolve(false);
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
              setTimeout(()=>{ if (onChainPollExists instanceof Promise && onChainPollExists.isPending) setModalView('new poll');
                }, 750);   // we'll ping it back off again if the poll turns out to exist ;)
              return addressObj.OWN_ADDRESS;
            })
            .catch (e=>{console.log('Web3 error, couldnt get own address:/ \n ADD STATE LOGIC FOR THIS CASE! (AddPoll.js)');})
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
      onChainPollExists = callTransaction('getPoll', {_poll : url })
      onChainPollExists.isPending=true;
      onChainPollExists
        .then(response=>{
          onChainPollExists.isPending=false;
          console.log(response);
          // NB even non existent polls will return a sensible looking (zeroed response object)
          // Use boolean isPoll() once it is migrated
          if (response.minStake>0) {
            // poll already exists on chain
            console.log(`found ${url} on chain`);
            setPollKnown(true);
            setKnownPolls(knownPolls.concat(url))
            setModalView(null);
            resolve (true);   // resolve back to the form - poll is valid and should be added if submit was pressed.
            return true
          } else {
            // poll doesn;t exist - so user should create it.
            console.log(`did NOT find ${url} on chain`);
            setNewPollUrl(url);
            setPollKnown(false);   // !!! this could easily get into a stuck state if fetches overlap - so how to recover?
            setModalView('new poll');
            // ******
            // skip this whole choosing part and pretend the poll is valid!
            console.log(`Adding ${url} as poll without checking or taking inout!!!`);
            add(url);
            clearSelf();
            // *******


            return false;    // resolve onwards in Promise.all, which will pull up the modal form
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
    ev.preventDefault();

    return new Promise((resolve, reject)=>{
      let { initiator, minStake, participants, venueCost, venuePayer } = formFields;
      venueCost = venueCost*1000;
      minStake = minStake*1000;

      console.log('Did the funny state trick work?',{ initiator, minStake, participants, venueCost, venuePayer } );
        if (
          (formFields.initiator.substr(0, 2) !== "0x" || formFields.initiator.length !== 42 || formFields.initiator.length === 0)
          || !(formFields.minStake > 0)
          || Number(formFields.participants).isNan()
          || Number(formFields.venueCost).isNan()
          || formFields.venuePayer.length && (formFields.venuePayer.subclassNamestr(0, 2) !== "0x" || formFields.venuePayer.length !== 42)
        )
          reject ('Bad input. Addresses must be addresses, numbers must be numbers (or blank if optional)');
        else
          sendTransaction('createPoll', { initiator, minStake, participants, venueCost, venuePayer })
            .then(success=> {
              resolve()
            })
            .catch(e=>{
              reject('Chain or netowrk error. Please try again.')
            }) ;
    })
  }

  return (
    <>
      <div className="polls-list__add-poll">
        <input
          id='new-poll-url'
          type="text"
          size={32}
          placeholder="Enter doodle poll URL, including https://"
          onBlur= { ()=>{ '??' } }
          onChange={ ev=>{
            setPollKnown( knownPolls.indexOf(ev.target.value)>-1 );
            //debounce
            validateUrl(ev)
          } }
          onSubmit= { ev=>{
            validateUrl(ev)
              .then(newPollUrl=>{
                if (newPollUrl) {
                  add(newPollUrl);
                  // ev.target.value = '';  // is this necessary - won't the new AddPoll be a fresh new component?
                }
              })
          } }
        />
      </div>
        { modalView &&
          ( modalView === 'new poll'
          ? <FormModal
                modal = { modalView }
                clearModal= { ()=>{ setModalView(null) } }
                onSubmit= { createPoll }
              >
              <div className=""><span className="">Poll: </span><span className="">{ foundPollName || '> __' }</span></div>
              <input
                id='new-poll-url-(modal)'
                type="text"
                size={32}
                value={ newPollUrl }
                onChange={ dontChange }
              />
              You will be, according to the blockchain, the initiator of this poll.
              You will be the only person able to change availabile timesolts and venue costs.
              If you change this field to an address which is unavailable or incorrect, nobody will be able to change these fields.
              Recommended : keep this field as { ownAddy }
              <input
                id="new-poll-initiator"
                defaultValue={ ownAddy }
                onChange={ handleInput('initiator') }
                onFocus={ ev=>{ warning(ev,`don't change initiator`); } }
              />
              Stakers must stake an amount of reputation (recommended: 1) to participate in the poll
              <input
                id="minimum-stake"
                placeholder="rep-stake"
                onChange={ handleInput('minStake') }
                onSubmit={ ()=>{ let x= x*1000 } }
              />
              All reputation stakes and venue deposits will be returned if the minimum of particpants is not reached
              <input
                id='mimimum-participants' />
                onChange={ handleInput('participants') }
              />
              Optional: Stakers must deposit (or someone must deposit for them) at minimum an equal share of the venue cost to participate in the poll
              <input
                id='venue-cost'
                onChange={ handleInput('venueCost') }
                onSubmit={ ()=>{ let x= x*1000 } }
              />
              Once the event is over, or all stakers have checked in, the venue cost can be disbursed to you, or another TT holder. You can change this person later
              <input
                id="venue-payer"
                defaultValue={ ownAddy }
                onChange={ handleInput('venuePayer') }
              />
              <button
                className = { cN('modal-button', 'modal-button__form-button') }
                onClick = { ()=> {
                  createPoll()
                    .then(()=>{
                      setModalView('Success. All is aces');
                    })
                    .catch (e=>{
                      // warn(e) - if this is state based, may as well set it in createPoll
                    })
                } }
              >
                Create this doodle poll in Lunchcoin
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
