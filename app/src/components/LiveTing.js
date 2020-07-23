import React, { useState, useEffect, useLayoutEffect } from 'react';
import Media from 'react-media';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { ConnectionError } from "web3";
import cN from 'classnames';

import { Button } from 'react-bootstrap';

import Header from "./Header";
import Section from "./Section";
import InfoModal from "./InfoModal";
import FormModal from "./FormModal";
import LogoBottom from "./LogoBottom";
import AdminLogger from "./AdminLogger";
import Toast from "./Toast";
import Dots from "./Dots";

import "../App.scss";
import './checkInView.css';

import { connectToWeb3, refetchOwnAddress, getDeets, setOwnAddyforAuthWeb3,
  getImplementationFunctions, getImplementationEvents, runConstructorManuallyFfs,
  callTransaction, sendTransaction, getFromStorage,
  myAccounts, } from "../Web3/accessChain";
import { isValidAddressFormat } from "../Web3/accessChain";   // move to chainFormatHelpers
import { getPrice } from "../helpers/priceFeed.js";
import { fetchOnlinePoll } from "../helpers/doodleFetchers.js";
import { time ,ms ,toUnixTime ,unixifyTimes ,kiloNiceNum ,niceNum ,niceTime,
  checkInClosingIn, eventToastOutput, prioritiseThirdPartyEvents, eventToastOutputLongFake } from "../helpers/outputFormatting.js";


const ether = 1e18;
const kEther = 1e21;
let OWN_ADDRESS = '0x000123';
const forceOwnAddyCheckin = true;
let t=[];
let toastClearer;

const LiveEvent = props => {
  const { pollUrl, setOwnAddyParent } = props;
  if (!pollUrl)
    throw ('Attempted to render LiveEvent with pollUrl='+pollUrl);

  const [noChainError, setNoChainError] = useState(false);
  const [polls, setPolls] = useState([]);
  const [livePolls, setLivePolls] = useState([]);
  const [ownAddress, setOwnAddy] = useState(OWN_ADDRESS);
  const [modalView, setModalView] = useState(null);
  const [burgerView, setBurgerView] = useState(false);
  const [toastView, setToastViewRaw] = useState(null);
  const [web3Error, setWeb3Error] = useState(null);
  const [error, setError] = useState(null);
  const [hideFunctions, setHideFunctions] = useState(true);
  const [pollName, setPollName] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState(['0x1234','0x5678']);
  // const [contractAddy, setContractAddy] = useState(ownAddy);
  const [caughtEvents, setCaughtEvents] = useState([]);
  const [sentTransaction, setSentTransaction] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInCloses, setCheckInClosesRaw] = useState(Infinity);
  const [checkInIsClosed, setCheckInIsClosed] = useState(null);
  const [stakers, setStakers] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [ownProof, setOwnProof] = useState([]);
  const [repStaked, setRepStakedRaw] = useState();
  const [repEverStaked, setRepEverStakedRaw] = useState();
  const [repWas, setRepWasRaw] = useState(0);
  const [venueCost, setVenueCostRaw] = useState(99);
  const [venuePot, setVenuePotRaw] = useState(88);
  const [youPaidForVenue, setYouPaidForVenueRaw] = useState(0);
  const [mismatchedProofs, setMismatchedProofs] = useState([]);
  const [repMultiplier, setRepMultiplierRaw] = useState(1.2);
  const [maxRep, setMaxRepRaw] = useState(1000);
  const [updatedRep, setUpdatedRepRaw] = useState(null);
  const [infoModalResult, setInfoModalResult] = useState([]);
  const [price, setPrice] = useState();
  // const [, set] = useState();
  const [validator1PeerCheckedIn, setValidator1PeerCheckedIn] = useState([[ OWN_ADDRESS, true ]]);

  const [setCheckInCloses ,setVenueCost ,setVenuePot ,setYouPaidForVenue, setRepStaked, setRepEverStaked, setRepWas ,setRepMultiplier, setMaxRep, setUpdatedRep ]
    = [setCheckInClosesRaw, setVenueCostRaw, setVenuePotRaw, setYouPaidForVenueRaw, setRepStakedRaw, setRepEverStakedRaw, setRepWasRaw, setRepMultiplierRaw, setMaxRepRaw, setUpdatedRepRaw ]
      .map(setter=> response=> { setter(Number(response)); });

  const setToastView = tV=>{
    setToastViewRaw( tV );
    toastClearer = setTimeout(()=> { setToastViewRaw(null) }, toastTimeout(tV));
  }

  const setOwnProofFromArray= proofsList=> {
    const newProof = stakers.map((staker, idx)=> stakers.indexOf(staker) > -1 );
    setOwnProof(newProof);
  }

// TODO: setRepWas setInfoModalResult

  clearInterval(t)
  // t[0]= setInterval(()=>{ showOwnAddy() }, 15000);


  const toastTimeout = toastView => 50000*1000;

  // pass this to Toast
  // returns false (ie supress) if any modal is up.
  // the logic is- it's like .filter, not like supress
  const defaultToastFilter = modalView => !Boolean(modalView);

  const errorButtons = [
    {
      errorStarts : 'Could not find your TT address',
      name : 'RETRY',
      action: ()=> {
        setError(null);
        connectToWeb3AndUpdate();
      }
    },
    {
      errorStarts : 'Unexpected network',
      name : 'RETRY',
      action: ()=> {
        setError(null);
        connectToWeb3AndUpdate();
      }
    },

  ];

  const errorButton= error=> {
    if (typeof error==='string') {
      return errorButtons.find(button=> error.startsWith(button.errorStarts));
    }
    // if unknown error, return undefined for Toast to use default behaviour (eg dismiss button)
  }

  const catchRelevantEvent = async (result, eventName)=> {
    const { returnValues } = result;
    const ownAddy = await refetchOwnAddress();
    // const ownAddy = getDeets().OWN_ADDRESS;
    console.log('\n\n\n\n\n\n\n\n\n\n\n\n\n');
    console.log(`(according to accessChain:) ${getDeets().OWN_ADDRESS}`);
    console.log(eventName);
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
    whassakeccack:
      (result, eventName)=> {
        console.log(eventName);
        console.log(result.raw);
        console.log(result.returnValues);
        setCaughtEvents(caughtEvents.concat({eventName}));
      },


    // emptyStakeRemoved: {
    //
    // },
    // gpResult: {
    //
    // },
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
      setUpdatedRepRaw(null);
      if (!ownAddress || ownAddress.length<42) {
        console.log(`Caught rep event, but it looks like state has reverted to inital value:/ ownAddress=${ownAddress}, retrieved from state again=${showOwnAddy()}. Refetching from web3.`);
        refetchOwnAddress().then(ownAddy => {
          console.log('\n\nrefetchOwnAddress SUCEEDED\n\n');
          fetchAndUpdateRep(ownAddy);
        })
      } else
      fetchAndUpdateRep();
    },
    venuePotDisbursed: catchRelevantEvent,

  }

  const showOwnAddy = ()=> {
    console.log(new Date().toTimeString().slice(0,8)+': '+ownAddress);
    return ownAddress;
  }

  const proofMismatchMessage = ()=> 'attendees are not in your check-in proof!'

// ----------------------- functions for useEffect

  const setOwnAddyForApp = addy=> {
    setOwnAddy(addy);
    setOwnAddyParent(addy);
    setOwnAddyforAuthWeb3(addy);
    // setOwnAddyinComponent(addy);
  }

  const getLocalCache =()=> {

  }

  const fetchAndUpdate = (freshAddy = ownAddress )=> {
    callTransaction('getproofsAsAddresses', {_poll : pollUrl})
      .then(response=>{
        console.log('getproofsAsAddresses', response);
        setProofs(response.filter(proof=>proof.length));

        // INCORRECT!!

        // if (response.some(proof=>proof.includes(freshAddy)))
        //   setCheckedIn(true);
      })
      .catch(err=>{console.log(err);});

    // Instead get proof(OwnAddy) from storage
    fetchAndUpdateStakerStatus(freshAddy);

    callTransaction('totalRepStaked', {_poll : pollUrl, _staker : freshAddy || ownAddress })
      .then(response=>{
        console.log('totalRepStaked', response);
        setRepStaked(response);
        setRepEverStaked(response);
      })
      .catch(err=>{console.log(err);});
    console.log('FETCHANDUPDATEREP',freshAddy,ownAddress,(freshAddy || ownAddress));
    fetchAndUpdateRep(freshAddy || ownAddress)
      .then(setRepWas);
    callTransaction('totalVenueContribs', {_poll : pollUrl, _staker : freshAddy || ownAddress })
      .then(response=>{
        console.log('totalVenueContribs', response);
        console.log(`Initial fetchandupdate gave setYouPaidForVenue= ${youPaidForVenue} (${response.total},${response[0]},${response})`);
        setYouPaidForVenue(response.total || (Array.isArray(response) && (response[0])) || response);
      })
      .catch(err=>{console.log('err:',err);});
    callTransaction('getPoll', {_poll : pollUrl })
      .then(response=>{
        console.log('getPoll', response);
        console.log(`Initial fetchandupdate gave getPoll= ${youPaidForVenue} (${response.total},${response[0]}`,response);
        setVenueCost(response.venueCost);
        setVenuePot(response.venuePot);
        setCheckInIsClosed(response.proofsWindowClosed);
      })
      .catch(err=>{console.log('err:',err);});

    callTransaction('maxRep')
      .then(setMaxRep)
      .catch(err=>{console.log('err:',err);});
    callTransaction('multiplier', {_poll : pollUrl})
      .then(response=> response.numerator/response.denominator)
      .then(setRepMultiplier)
      .catch(err=>{console.log('err:',err);});

      // NB getFromStorage failing!
    // getFromStorage('pollData', pollUrl)
    //   .then(response=>{
    //     console.log('getFromStorage: pollData(pollUrl)',response);
    //     setVenueCost(response.venueCost);
    //     setVenuePot(response.venuePot);
    //   });
    // callTransaction('', {_poll : pollUrl})
    //   .then(response=>{
    //     console.log(response);
    //     // setVenueCost
    //   });


  // setMismatchedProofs

    // Promise.all( pollUrls.map (poll=> new Promise(resolve=>{
    //   callTransaction('getPoll', { poll })
    //     .then (async response=> {
    //       response.url = poll;
    //       // await setState is not a thing!!!
    //       await setPolls (
    //         polls
    //           .filter( knownPoll=> knownPoll.url != poll )
    //           .concat( [unixifyTimes(response)] )
    //           .sort( byStartEndSort )
    //       );
    //     });

    //     resolve();
    // })))
    // .then(async ()=> {
    //   // await setState is not a thing!!!
    //   await setLivePolls (
    //       polls.filter(poll=> (poll.end>Date.now() && poll.start<Date.now()))
    //   );
    //   if (!currentPoll && livePolls.length) {
    //     if (livePolls.length === 1)
    //       setCurrentPoll(livePolls[0])
    //     else
    //       setChoosePoll(true);
    //   };
    // });
    getPrice()
      .then(setPrice);
  }

  const fetchAndUpdateRep = (staker = ownAddress )=> new Promise((resolve, reject)=> {
    console.log('ownAddy',ownAddress,'getRep', {staker});
    callTransaction('getRep', {staker})
      .then(response=>{
        console.log('setting updatedRep');
        setUpdatedRep(response);
        resolve(response);
      })
      .catch(err=>{ console.log(`getRep failed`, err); reject(err); });
  })


// ----------------------- chain access functions (other than those above for useEffect)

  const fetchAndUpdateStakerStatus = (freshAddy)=> {
    callTransaction('getStakerAddresses', {_poll : pollUrl})
      .then(response=>{
        console.log('getStakerAddresses', response);
        setStakers (response);
        if (response.indexOf(freshAddy || ownAddress)>-1)
          callTransaction('getStakersProof', {_poll : pollUrl, _staker : freshAddy || ownAddress })
            .then(response=>{
              console.log('expecting array representing own proof:',response);
              if (response.length) {
                setOwnProofFromArray(response);
                setCheckedIn(true);
              } else
                setCheckedIn(false);
            })
            .catch(err=>{console.log(err);});
      })
      .catch(err=>{console.log(err);});
  }


  const addProofBitByBit = async (args)=>{
    // NB data structure changed - this should still work as structure of _newProof should be the same by the time we reach here
    const remaining = args._newProof.splice(1);
    return await sendTransaction('addProof', args)   // ownAddy is hack for demo - validator will be more complex than this!
      .then(async (resp)=>{
        if (remaining.length) {
          console.log(`OK, ${remaining.length} parts remaining`);
          await addProofBitByBit ({...args, _newProof: remaining});
          return resp
        } else { console.log('Proofs added bit by bit'); }
      })
      .catch(err=>{ console.log(`getproofsAsAddresses failed`, err); });

  }

  // NB proof (_newProof) will eventually be more complex than an addy;
  // NB _impersonatedStaker is a temporary expedient for testing which will be removed
  const submitProof = ()=> {
    const _impersonatedStaker = ownAddress;
    const args = {
      _poll: pollUrl,
      _newProof: ownProof.map((tick, stakerNo)=> tick && stakers[stakerNo] ).filter(Boolean),
      _impersonatedStaker
    };
    let getproofsAsAddressesIsOK = true;

    setModalView(null);
    console.log('\n\n\n\n\n\n\n');
    if (args._newProof.length)
      console.log('args OK', args, ownProof, args._newProof)
    else
      console.log('args NOT OK:', args, ownProof, args._newProof);
    sendTransaction('addProof', args)   // ownAddy is hack for demo - validator will be more complex than this!
      .then(response=>{
        if (getproofsAsAddressesIsOK)
        callTransaction('getproofsAsAddresses', {_poll : pollUrl})
          .then(response=>{
            fetchAndUpdateStakerStatus(ownAddress);
            setProofs(response.filter(proof=>proof.length));
          })
          .catch(err=>{ console.log(`getproofsAsAddresses failed`, err); });
      })
      .catch (err=>{
        console.log('Will try bit by bit (as assuming this V is a VM error)');
        addProofBitByBit(args)
          .then(response=> {
            if (getproofsAsAddressesIsOK)
            callTransaction('getproofsAsAddresses', {_poll : pollUrl})
              .then(response=>{
                fetchAndUpdateStakerStatus(ownAddress);
                setProofs(response.filter(proof=>proof.length));
                // setProofs(response);  // Cheekily accept the uninitilised empty proofs ;)
              })
              .catch(err=>{ console.log(`getproofsAsAddresses failed`, err); });
          })
          .catch (err=>{console.log('Fuck.', err); } );
      });
  }


  const closeCheckin = ()=> {
    sendTransaction('closeProofsWindow', { poll : pollUrl })
      .then(response=>{
        console.log('closeProofsWindow',response);
        callTransaction('isProofsWindowClosed', { _poll : pollUrl })
        .then(response=>{
          console.log('isProofsWindowClosed: pollData(pollUrl)',response);
          setCheckInIsClosed(response);
        });
      });
  }

  const emptyBytes32 = '0x00';
 // refundStake (string memory _poll, bytes32 _reveal)

  const claimRep = ()=> {
    setModalView('reclaim rep');
    setSentTransaction([Date.now(),'reclaim rep']);
    sendTransaction('refundStake', {_poll: pollUrl, _reveal: emptyBytes32 })
      .then(response=>{
        setTimeout(()=>{
        callTransaction('totalRepStaked', {_poll: pollUrl, _staker: ownAddress })
          .then(response=>{
            if (response>0)
              console.log(response);
          })
        },500)
      })
  }

  const doVenueRefund = ()=>{
    setModalView('venue refund');
    setCaughtEvents([]);
    setSentTransaction([Date.now(),'venue refund']);
    sendTransaction('refundVenueStakes', {_poll: pollUrl } )
      .then (response => {
        // ignore response.transactionHash
        [0,250,500].forEach(ms=> {
          setTimeout(()=>{
            console.log(`${ms}ms: ${caughtEvents.length}`,caughtEvents);
          }, ms)
        });
        console.log(`Response ${Date.now()-sentTransaction[0]}ms after ${sentTransaction[1]} sent.`);
        // setTimeout( ()=>{ setCaughtEvents([]) }, 501);
      })
      .catch (err => {
        console.log(err);
      });
  }

  const connectToWeb3AndUpdate = (retries, ms=5000)=> {
    connectToWeb3().then(addressObj => {
      console.log('\n\nconnectToWeb3 SUCEEDED\n\n');
      getImplementationEvents({ pollUrl, setWatchers:true }, chainEventListeners );
      console.log(addressObj);
      if (!addressObj.OWN_ADDRESS)
        console.log(`\n\n\n\nWarning - setOwnAddy(${addressObj.OWN_ADDRESS})\n\n\n\n`);
      console.log(`\n\nsetOwnAddy(${addressObj.OWN_ADDRESS})\n (Previous was ${ownAddress})\n`);
      setOwnAddyForApp(addressObj.OWN_ADDRESS);
      console.log(`\n\nsetOwnAddy(${addressObj.OWN_ADDRESS})\nis done. New ownAddy=${ownAddress} \n`);
      // setContractAddy(addressObj.IMPLEMENTATION_ADDRESS);
      setAvailableAccounts(addressObj.availableAccounts);
      runConstructorManuallyFfs();
      return addressObj.OWN_ADDRESS
    }).then(addy=> {
      if (isValidAddressFormat(addy))
        fetchAndUpdate(addy);
      else {
        setError(`Could not find your TT address. \nPlease use the Thundercore Hub to use lunchcoin / allow your web3 provider to access your address.${retries && `\nRetrying (${retries})`}`);
        if (retries--)
        setTimeout( ()=>{
          setError(null);
          connectToWeb3AndUpdate(retries,ms);
        }, ms);
      }
    })
      .catch(err=> {
        // we should be catching here: 105: reject (new Error('no web3 provider'));
        console.log('\n\nconnectToWeb3 FAILED\n\n');
        console.log('fetchAndUpdate gave',err);
        if (err.message==='no web3 provider') {
          setError(err.message);
        }
        if (err.message.startsWith('Contract mismatch')) {
          setError(err.message);
        }

        // VV this is incorrect - that error can also signify WS disconnected
        if (err.message==='connection not open on send()') // || (ConnectionError==='object' && err instanceof ConnectionError))
          setNoChainError(true)
        else {
          setWeb3Error(true);
          setError(err.message);
        }
      })
  }


// ----------------------- useEffect

  useEffect(()=> {
    getLocalCache();
    fetchOnlinePoll(pollUrl)
      .then(poll=> poll.name)
      .then(setPollName);
    connectToWeb3AndUpdate(1);

  }, []);



// ----------------------- helpers

// // These ones moved to helpers/outputFormatting.js
    //
    // const time = d=> d.toTimeString().slice(0,8);
    // const ms = d=> (d%1000).toFixed(3);
    //
    // const toUnixTime = x=>x;
    //
    // const unixifyTimes = resp=>
    //   Object.assign (resp,
    //     { start : resp.start ? toUnixTime(resp.start) : resp.start },
    //     { end : resp.end ? toUnixTime(resp.end) : resp.end },
    //   );
    //
    // const kiloNiceNum = num=>
    //   num >= 1000000
    //     ? niceNum(num/1000000)+' M'
    //     : num >= 1000
    //       ? niceNum(num/1000)+' k'
    //       : (num >= 1 || num==0)
    //         ? niceNum(num)
    //         : niceNum(num*1000)+' m' ;
    //
    // const niceNum = num=>
    //   (num || num===0)
    //     ? (Math.round(num*1000)/1000).toString()
    //     : '_' ;
    //
    // const niceTime = (time=498705720) =>
    //   time < Infinity
    //     ? new Date(time).toTimeString().slice(0,14)
    //     : 'Never' ;
    //
    // const checkInClosingIn = checkinCloses=>
    //   Math.max (checkinCloses-Date.now(), 0) ;


    // NB Using covering refunds -
    const venueRefundDue = ()=>{
      return Math.max (youPaidForVenue -(venueCost/stakers.length), 0);
    }

    const rekey = keyedByNum=> {
      const result = {};
      Object.keys(keyedByNum)
        .filter (key=>Number(key).isNan())
        .forEach(key=>
          result[key] = keyedByNum.find(x=> x==keyedByNum[key] ) || keyedByNum[key]
          // All about the readable code :P
        )
      return result
    }

    const unpackStringResponseToNum = response=>
      typeof response==='string)'
        ? Number(response)
        : response ;

    const asSubmit = fn=> ev=> {
      ev.preventDefault();

      console.log(ev);
       // you're accessing the property `target` on a released/nullified synthetic event.
       // This is set to null. If you must keep the original synthetic event around,
       //  use event.persist().
      fn (ev.formArgs);
    }

    const shouldVSquash = (matches, childrenLength)=>
      (matches.w320 && modalView)
      ||
          ( childrenLength
            || (modalView==='check in' && stakers.length)>11
            || (modalView==='venue refund' && caughtEvents.length)
          ) >11
      ||
          ( childrenLength
            || (modalView==='check in' && stakers.length)
            || (modalView==='venue refund' && caughtEvents.length)
          ) >9 && matches.h880 ;

    const accountSetters = (availableAccounts,n)=>{
      const result = {};
      const accounts = new Array(n)
        .fill()
        .map((_,idx)=> availableAccounts[idx])
        .forEach(address=> {
          result[address]=()=> {
            if (!address)
              console.log(`\n\n\n\nWarning - setOwnAddy(${address})\n\n\n\n`);
            setOwnAddyForApp(address);
            fetchAndUpdate(address);
            console.log(address);
          } }) ;
      return result
    }

return( <>
    <Media queries={{ w320: "(max-width: 479px)", h880: "(max-height: 879px)" }}>
      { matches =>
        <div className={'checkin-view'}>

          <Header
            live={ true }
            pollName={ pollName }
            pollUrl={ pollUrl }
            burger= {{
              show : true,
              expand : burgerView,
              setBurgerView,
              menuItems: {
                'Hide/Show all functions' : ()=>{ console.log('hide:',!hideFunctions); setHideFunctions(!hideFunctions); },
                ...accountSetters(availableAccounts,9),
                'Reopen Check-in' : ()=>{ sendTransaction('reopenProofsWindow', {_poll : pollUrl }) },
                'Fetch from chain (or click pizza)' : ()=>{ fetchAndUpdate(); },
                'Hide Menu' : ()=>{ setBurgerView(false); },
                'Pop up toast' : ()=>{ setToastView(!toastView && 'Whoop Whoop'); }
              }
            }}
          />

          <Section
            id='checkin'
            buttonSuper= { `You are ${ checkedIn ? '' : 'not ' }checked in ${ !checkedIn && checkInIsClosed ? '\nbut check-in is closed' : '' }` }
            buttonText= { checkedIn ? 'Update check-in proofs' : 'Check In' }
            buttonAction= { ()=>{ setModalView('check in'); setCaughtEvents([]); } }
            buttonDisabled= { checkInIsClosed || !checkInClosingIn(checkInCloses) }
          >
            <div className="strong left-align">
              <span className="address42"> { ownAddress } </span> (you)
            </div>
            <div className="strong right-align">
              staked <span className="hype hanging"> { niceNum(repStaked/1000) } Rep </span>
            </div>
          </Section>

          <div className="full-width thin-section">
            { !checkInIsClosed && checkInClosingIn(checkInCloses)
              ? `${checkInCloses<5*60000 ? 'Hurry Hurry, check-in closing, yo!' : 'Check-in will close:'} ${ niceTime(checkInCloses) }`
              : 'Check-in is closed'
            }

          </div>

          { mismatchedProofs.length && checkedIn &&
              <Section
                id='proof-mismatch'
                error = { true }
                buttonText= { 'Update check-in proofs' }
                buttonAction= { ()=>{ setModalView('check in'); setCaughtEvents([]); }}
                buttonDisabled= { !checkInClosingIn(checkInCloses) }
              >
                <div className="left-align">
                  <span className="strong hype">
                  { `${mismatchedProofs.length}/${proofs.length} ` }
                  </span>
                  { proofMismatchMessage() }
                </div>
              </Section>
            || null
          }


          <Section
            id='close-checkin'
            buttonSuper= { checkInIsClosed || !checkInClosingIn(checkInCloses) ? '' : 'Close check-in cannot be undone' }
            buttonText= { 'Close check-in early' }
            buttonAction= { closeCheckin }
            buttonDisabled= { checkInIsClosed || !checkInClosingIn(checkInCloses) || proofs.length < stakers.length }
            buttonHidden= { !checkInClosingIn(checkInCloses) }
          >
            <div className="left-align">
              <span className="strong hype">
              { `${proofs.length}/${stakers.length} ` }
              </span>
                stakers checked in
            </div>
          </Section>

          <Section
            id='rep-refund'
            buttonSuper= { checkedIn ? checkInIsClosed ? '' : 'Reclaim your rep \nonce check-in is closed' : 'Check in to reclaim your rep' }
            buttonText= { !repStaked ? 'Unstake me now' : `Your reputation is restored 😎` }   // U+1F60E}
            buttonText= { 'Unstake me now' }
            buttonAction= { claimRep }
            buttonDisabled= { !checkedIn || !checkInIsClosed ||  !repStaked }
            sectionHidden= { !repEverStaked }
          >
            <div className="strong right-align">
              You staked <span className="hype hanging"> { niceNum(repStaked/1000) } Rep </span>
            </div>
          </Section>

          <Section
            id='venue-refund'
            buttonText= { venueRefundDue(venueCost,youPaidForVenue)
              ? `Refund ${ kiloNiceNum(venueRefundDue(venueCost,youPaidForVenue)) }TT`
              : `We're all square 😎`   // U+1F60E
            }
            buttonAction= { venueRefundDue(venueCost,youPaidForVenue) ? doVenueRefund : ()=>{ console.log('v()',venueCost,youPaidForVenue,venueRefundDue(venueCost,youPaidForVenue)); } }
            buttonDisabled= { !venueRefundDue(venueCost,youPaidForVenue)  }  // NB In order to keep it visible, the buttonAction is disabled with && instead.
            sectionHidden= { !youPaidForVenue }
            buttonStyles= { !venueRefundDue(venueCost,youPaidForVenue) && 'button__disabled__venue-refund-special-case'  }
          >
            <div className="centre-align">
              Venue cost was { kiloNiceNum(venueCost) }TT
            </div>
            <div className="centre-align">
              You paid <span className="hype hype-small">{ kiloNiceNum(youPaidForVenue) }TT</span>
            </div>
          </Section>


          { !shouldVSquash(matches) &&
            <LogoBottom refresh={ ()=>{ fetchAndUpdate(); }} />
          }


          { null &&
          <TransitionGroup className="todo-list">
            <CSSTransition
              key={ 'meh' }
              in={ Boolean(toastView) }
              timeout={500}
              classNames="item"
            >

              <div className={ cN('toast', 'item') } >
                { toastView }

                { toastView &&
                  <Button
                    className="remove-btn"
                    variant="danger"
                    size="sm"
                  >
                    &times;
                  </Button>
                }
              </div>

            </CSSTransition>
          </TransitionGroup>
          }


          { defaultToastFilter(modalView) && toastView &&
            <Toast visible={ ()=>Boolean(toastView) } hide={ ()=>{ setToastView(null) } }
              content={[ toastView, eventToastOutput(toastView) ]}
            >
              <div className="toast__header">
                { eventToastOutput(toastView).header }
              </div>
              <div className="toast-text">
                { eventToastOutput(toastView).text }
              </div>

            </Toast>
          }


          { error &&
            <Toast
              visible={ ()=>Boolean(error) }
              hide={ ()=>{ setError(null) } }
              accept={ errorButton(error) && errorButton(error).action }
              content={[ error, eventToastOutput(error) ]}
            >
              <div className="toast__header">
                { eventToastOutput(error).header }
              </div>
              <div className="toast-text">
                { eventToastOutput(error).text }
              </div>

            </Toast>
          }


          { modalView &&
            <div className="modal-container">
              <div className="modal-background" onClick={ (ev)=>{ if (ev.target===ev.currentTarget) setModalView(null); } } >
                { // check in is the only FormModal - if it's not check in, use an InfoModal which does more automatically
                modalView==='check in'
                  ? <FormModal
                      modal = { modalView }
                      clearModal= { ()=>{ setModalView(null) } }
                      submit= { submitProof  /*NB not yet implemented in FormModal - see submit below */ }
                    >

                          <div>{ ownAddress }</div>
                          <div className=""><span className="hype-small">Validator:</span><span className=""> Mutual Agreement</span></div>
                          <div className={ cN(
                              'w100 text__centred__heavy',
                              'w100 text__centred__heavy__nonsquash'
                            )}>
                              Check in your friends
                          </div>
                          <form className = { cN(
                                'horiz-align',
                                shouldVSquash(matches) && 'modal__v-squash'
                              ) }>
                            <div className="horiz-aligned-elements-container">
                              { stakers.map((staker,stakerNo)=>
                                <div key={`${stakerNo}:${staker}`} className="w100">
                                  <span className={ cN(
                                      'address42',
                                      staker===ownAddress && 'line__highlight'
                                    )}>
                                    { staker }
                                  </span>
                                  <span className="w20r">
                                    <input
                                      type="checkbox"
                                      className="modal-checkbox w20r"
                                      checked= { ownProof[stakerNo] || (forceOwnAddyCheckin && staker===ownAddress) }
                                      onClick= {()=>{
                                        const newProof = [...ownProof];
                                        newProof[stakerNo]= !ownProof[stakerNo] || (forceOwnAddyCheckin && staker===ownAddress);
                                        setOwnProof( newProof );
                                      }}
                                    />
                                  </span>
                                </div>
                              )}
                            </div>
                            <button
                              className = { cN(
                                'modal-button',
                                'modal-button__form-button',
                              ) }
                              onClick = { asSubmit(submitProof) }
                            >
                              Check In
                            </button>
                          </form>
                    </FormModal>


                  : <InfoModal
                      modal = { modalView }
                      clearModal= { modalView === 'reclaim rep'
                                      ? ()=>{ setRepWas(updatedRep); setModalView(null) }
                                      : ()=>{ setModalView(null) }
                                  }
                      shouldVSquash = { shouldVSquash(matches) }
                      buttonText= { modalView==='venue refund' ? 'Cool!' : 'Whoop whoop!' }
                      loadingText= { modalView==='venue refund' ? 'Waiting for refund confirmations' : `Current rep: ${ niceNum(repWas/1000) }. Updating...` }
                      loading = { modalView==='venue refund'
                        ? !caughtEvents.filter(event=> event.eventName==='venuePotDisbursed').length
                        : !caughtEvents.filter(event=> event.eventName==='repRefund' && "event.returnValues.staker===ownAddress").length
                      }
                    >
                    { modalView==='venue refund'
                    ? <>
                      <div className="hype-small">Refunded to:</div>
                      <div className= { cN(
                        'horiz-aligned-elements-container',
                        shouldVSquash(matches) && 'modal__v-squash'
                      )}>
                        { caughtEvents
                            .filter(event=> event.eventName==='venuePotDisbursed')
                            .sort(event=> prioritiseThirdPartyEvents(event, ownAddress))
                            .map (event=>{
                              const { returnValues } = event;
                              const { amount, by, to } = returnValues;
                              return <div className={ cN(
                                'w100',
                                shouldVSquash(matches) && 'modal__v-squash'
                              ) }>
                                <span className={ cN('address42', 'w70') }>{ to } </span>
                                <span className={ cN(
                                    'address42',
                                    'w30r',
                                    shouldVSquash(matches) && 'w30r__v-squash',
                                    shouldVSquash(matches) && caughtEvents.length>12 && 'w30r__v-very-squash',
                                ) }>
                                  { shouldVSquash(matches)
                                    ? <>
                                        <span className={ cN('hype-small') }>
                                          { kiloNiceNum(amount) }TT
                                        </span>
                                        { price &&
                                          <span className={ cN('sub-right') }>
                                             (USD { niceNum(amount*price) })
                                          </span>
                                        }
                                      </>
                                    : <>
                                        <div className={ cN('hype') }>
                                          { kiloNiceNum(amount) }TT
                                        </div>
                                        { price &&
                                          <div className={ cN('sub-right', 'hype-small') }>
                                             (USD { niceNum(amount*price) })
                                          </div>
                                        }
                                      </>
                                  }
                                </span>
                             </div>
                             /*
                              TODO: add responsive alternative to hype, hype-small

                             */
                           })
                         }
                     </div>
                    </>
                  : <>
                      <div className={ cN("modal-info__header", "w100", "hype-small") }> Reputation update </div>
                      { caughtEvents
                          .filter(event=> event.eventName==='repRefund' && event.returnValues.staker===ownAddress)
                          .map (event=>{
                            const { returnValues } = event;
                            const { staker, staked, refunded } = returnValues;
                            return <React.Fragment key={`${staker}${staked}${refunded}`}>
                              <div className={ cN("hype-small", "w70") }>Your rep was: { niceNum(repWas/1000) } </div>
                              <div className="w70"><span className="hype-small">+ stake </span>({ niceNum(repStaked/1000) }) X {repMultiplier} = <span className="hype-small">{ niceNum(repMultiplier*repStaked/1000) } </span></div>
                              { updatedRep && updatedRep>=maxRep &&
                                <div className="w70"><span className="hype-small">Maximum rep</span>: <span className="hype-small">{ niceNum(maxRep/1000) } </span></div>
                              }
                              <div>Your rep is now:
                                <span className={ cN("hype") }>
                                  {'  '}{ updatedRep===null ? <Dots /> : niceNum(updatedRep/1000) }
                                </span>
                              </div>
                            </React.Fragment>
                          })
                      }
                    </>

                    }
                    </InfoModal>
                }
              </div>
            </div>
          }

        </div>
      }
    </Media>



    { false &&
      <AdminLogger ownAddy={ ownAddress } />
    }
  </>)
}

export default LiveEvent;
