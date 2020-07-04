import React, { useState, useEffect, useLayoutEffect } from 'react';
import { ConnectionError } from "web3";
import cN from 'classnames';

import Header from "./Header";
import Section from "./Section";
import InfoModal from "./InfoModal";
import FormModal from "./FormModal";
import LogoBottom from "./LogoBottom";
import AdminLogger from "./AdminLogger";
import Dots from "./Dots";

import "../App.scss";
import './checkInView.css';

import { connectToWeb3, getImplementationFunctions, getImplementationEvents,
  callTransaction, sendTransaction, getFromStorage,
  myAccounts, } from "../Web3/accessChain";
import { getPrice } from "../helpers/priceFeed.js";

let OWN_ADDRESS = '0x000';
let t=[];

const LiveEvent = props => {
  const { pollUrl, events, setOwnAddyParent } = props;
  if (!pollUrl)
    throw ('Attempted to render LiveEvent with pollUrl='+pollUrl);

  const [noChainError, setNoChainError] = useState(false);
  const [polls, setPolls] = useState([]);
  const [livePolls, setLivePolls] = useState([]);
  const [ownAddress, setOwnAddy] = useState(OWN_ADDRESS);
  OWN_ADDRESS = '0x123';
  const [modalView, setModalView] = useState(null);
  const [burgerView, setBurgerView] = useState(false);
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
  const [repMultiplier, repMultiplierRaw] = useState(1.25);
  const [maxRep, setMaxRepRaw] = useState(1000);
  const [updatedRep, setUpdatedRepRaw] = useState(null);
  const [infoModalResult, setInfoModalResult] = useState([]);
  const [price, setPrice] = useState();
  // const [, set] = useState();
  const [validator1PeerCheckedIn, setValidator1PeerCheckedIn] = useState([[ OWN_ADDRESS, true ]]);

  const [setCheckInCloses ,setVenueCost ,setVenuePot ,setYouPaidForVenue, setRepStaked, setRepEverStaked, setRepWas ,setRepMultiplier, setMaxRep, setUpdatedRep ]
    = [setCheckInClosesRaw, setVenueCostRaw, setVenuePotRaw, setYouPaidForVenueRaw, setRepStakedRaw, setRepEverStakedRaw, setRepWasRaw, repMultiplierRaw, setMaxRepRaw, setUpdatedRepRaw ]
      .map(setter=> response=> { setter(Number(response)); });

// TODO: setRepWas setInfoModalResult

  clearInterval(t)
  // t[0]= setInterval(()=>{ showOwnAddy() }, 15000);

  const catchRelevantEvent = (result, eventName)=> {
    const { returnValues } = result;
    console.log(eventName);
    console.log(result.raw);
    console.log(result.returnValues);
    setCaughtEvents( prevState=> prevState.concat(
      { eventName, returnValues, age: Date.now() }
    ));
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
      const ownAddy=showOwnAddy();
      // console.log('FETCHANDUPDATEREP', ownAddy);
      // if (!ownAddy || ownAddy.length<42) {
      //   t[1]= setTimeout(()=>{ fetchAndUpdateRep(); }, 500)
      //   console.log(`ownAddy is now ${ownAddy}. Setting timeout to recheck soon.`);
      //   t[2]= setTimeout(()=>{ console.log(`After timeout, ownAddy is now ${ownAddy}`); }, 3000)
      // } else
      // fetchAndUpdateRep();
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
    // setOwnAddyinComponent(addy);
  }

  const getLocalCache =()=> {

  }

  const fetchOnlinePoll = (pollUrl)=> {
    setPollName(`Let's go to the beach!!`);
    // fetch(pollUrl)
    //   .then (resp=> resp.xml)
    //   .then (pull out name, etc.)
    //   .then (setPollName) ;
  }


  const fetchAndUpdate = (freshAddy = ownAddress )=> {
    callTransaction('getproofsAsAddresses', {_poll : pollUrl})
      .then(response=>{
        console.log('getproofsAsAddresses', response);
        setProofs(response.filter(proof=>proof.length));
        if (response.some(proof=>proof.includes(freshAddy)))
          setCheckedIn(true);
      })
      .catch(err=>{console.log(err);});

    // Instead get proof(OwnAddy) from storage
    callTransaction('getStakerAddresses', {_poll : pollUrl})
      .then(response=>{
        console.log('getStakerAddresses', response);
        setStakers (response);
        if (response.indexOf(freshAddy || ownAddress)>-1)
          callTransaction('getStakersProof', {_poll : pollUrl, _staker : freshAddy || ownAddress })
            .then(response=>{
              console.log('expecting array representing own proof:',response);
              if (response.length) {
                setOwnProof(response);
                setCheckedIn(true);
              } else
                setCheckedIn(false);
            })
            .catch(err=>{console.log(err);});
      })
      .catch(err=>{console.log(err);});
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
        if (!response.proofsWindowClosed)
          console.log('Why is response.proofsWindowClosed',response.proofsWindowClosed,'in',response);
        setCheckInIsClosed(response.proofsWindowClosed);
      })
      .catch(err=>{console.log('err:',err);});

    callTransaction('getproofsAsAddresses', {_poll : pollUrl})
      .then(setMaxRep)
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

  const fetchAndUpdateRep = (_staker = ownAddress )=> new Promise((resolve, reject)=> {
    console.log('ownAddy',ownAddress,'getRep', {_staker});
    callTransaction('getRep', {_staker})
      .then(response=>{
        console.log('setting updatedRep');
        setUpdatedRep(response);
        resolve(response);
      })
      .catch(err=>{ console.log(`getRep failed`, err); reject(err); });
  })

// ----------------------- chain access functions (other than those above for useEffect)


  const addProofBitByBit = async (args)=>{
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
    const _newProof = ownProof;
    const _impersonatedStaker = ownAddress;
    const args = {_poll: pollUrl, _newProof: ownProof, _impersonatedStaker } ;
    let getproofsAsAddressesIsOK = true;

    setModalView(null);
    sendTransaction('addProof', args)   // ownAddy is hack for demo - validator will be more complex than this!
      .then(response=>{
        if (getproofsAsAddressesIsOK)
        callTransaction('getproofsAsAddresses', {_poll : pollUrl})
          .then(response=>{
            console.log('setting CheckedIn');
            setProofs(response.filter(proof=>proof.length));
            // setProofs(response);  // Cheekily accept the uninitilised empty proofs ;)
            setCheckedIn(true);
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
                console.log('setting CheckedIn');
                setProofs(response.filter(proof=>proof.length));
                // setProofs(response);  // Cheekily accept the uninitilised empty proofs ;)
                setCheckedIn(true);
              })
              .catch(err=>{ console.log(`getproofsAsAddresses failed`, err); });
          })
          .catch (err=>{console.log('Fuck.', err); } );
      });
  }


  const closeCheckin = ()=> {
    sendTransaction('closeProofsWindow', {_poll : pollUrl })
      .then(response=>{
        console.log('closeProofsWindow',response);
        callTransaction('isProofsWindowClosed', {_poll : pollUrl })
        .then(response=>{
          console.log('isProofsWindowClosed: pollData(pollUrl)',response);
          setCheckInIsClosed(response);
        });
      });
  }

  const emptyBytes32 = '0x00';
 // refundStake (string memory _poll, bytes32 _reveal)

  const claimRep = ()=> {
    // Not yet implemented in contract!
    setModalView('reclaim rep');
    setSentTransaction([Date.now(),'reclaim rep']);
    sendTransaction('refundStake', {_poll: pollUrl, _reveal: emptyBytes32 })
      .then(response=>{
        setTimeout(()=>{
        callTransaction('totalRepStaked', {_poll: pollUrl, _staker: ownAddress })
          .then(response=>{
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

// ----------------------- useEffect

  useEffect(()=> {
    getLocalCache();
    fetchOnlinePoll(pollUrl);
    connectToWeb3().then(addressObj => {
      console.log('\n\nconnectToWeb3 SUCEEDED\n\n');
      getImplementationEvents({ setWatchers:true }, chainEventListeners );
      console.log(addressObj);
      console.log('which one is ownAddy, which is IMPLEMENTATION_ADDRESS?' );
      if (!addressObj.OWN_ADDRESS)
        console.log(`\n\n\n\nWarning - setOwnAddy(${addressObj.OWN_ADDRESS})\n\n\n\n`);
      console.log(`\n\nsetOwnAddy(${addressObj.OWN_ADDRESS})\n (Previous was ${ownAddress})\n`);
      setOwnAddyForApp(addressObj.OWN_ADDRESS);
      console.log(`\n\nsetOwnAddy(${addressObj.OWN_ADDRESS})\nis done. New ownAddy=${ownAddress} \n`);
      // setContractAddy(addressObj.IMPLEMENTATION_ADDRESS);
      setAvailableAccounts(addressObj.availableAccounts);
      return addressObj.OWN_ADDRESS
    }).then(addy=> {
      fetchAndUpdate(addy);
    })
      .catch(err=> {
        // we should be catching here: 105: reject (new Error('no web3 provider'));
        console.log('\n\nconnectToWeb3 FAILED\n\n');
        console.log('fetchAndUpdate gave',err);
        if (err.message==='connection not open on send()' || err instanceof ConnectionError)
          setNoChainError(true);
      })

  }, []);



// ----------------------- helpers


    const time = d=> d.toTimeString().splice(0.8);
    const ms = d=> (d%1000).toFixed(3);

    const toUnixTime = x=>x;

    const unixifyTimes = resp=>
      Object.assign (resp,
        { start : resp.start ? toUnixTime(resp.start) : resp.start },
        { end : resp.end ? toUnixTime(resp.end) : resp.end },
      );

    const niceNum = num=>
      (num || num===0)
        ? (Math.round(num*1000)/1000).toString()
        : '_' ;

    const niceTime = (time=498705720) =>
      time < Infinity
        ? new Date(time).toTimeString().slice(0,14)
        : 'Never' ;

    const checkInClosingIn = checkinCloses=>
      Math.max (checkinCloses-Date.now(), 0) ;


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

return(<>
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
              'Fetch from chain' : ()=>{ fetchAndUpdate(); },
              'Hide Menu' : ()=>{ setBurgerView(false); }
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
          buttonText= { !repStaked ? 'Unstake me now' : `Your reputaion is restored 😎` }   // U+1F60E}
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
            ? `Refund ${niceNum(venueRefundDue(venueCost,youPaidForVenue)/1000)}k TT`
            : `We're all square 😎`   // U+1F60E
          }
          buttonAction= { venueRefundDue(venueCost,youPaidForVenue) ? doVenueRefund : ()=>{ console.log('v()',venueCost,youPaidForVenue,venueRefundDue(venueCost,youPaidForVenue)); } }
          buttonDisabled= { null  }  // NB In order to keep it visible, the buttonAction is disabled with && instead.
          sectionHidden= { !youPaidForVenue }
        >
          <div className="centre-align">
            Venue cost was { niceNum(venueCost)/1000 }k TT
          </div>
          <div className="centre-align">
            You paid <span className="hype hype-small">{ niceNum(youPaidForVenue)/1000 }k TT</span>
          </div>
        </Section>

        <LogoBottom refresh={ ()=>{ fetchAndUpdate(); }} />

        { modalView &&
          <div className="modal-container">
            <div className="modal-background" onClick={ (ev)=>{ if (ev.target===ev.currentTarget) setModalView(null); } } >
              { modalView==='check in'
                ? <FormModal
                    modal = { modalView }
                    clearModal= { ()=>{ setModalView(null) } }
                    submit= { submitProof  /*NB not yet implemented in FormModal - see submit below */ }
                  >
                    <div>{ ownAddress }</div>
                    <div className=""><span className="">Validator:</span><span className=""> Mutual Agreement</span></div>
                    <div className="">Check in your friends</div>
                    <form>
                      { stakers.map((staker,stakerNo)=>
                        <div key={staker} className="w100">
                          <span className="address42">
                            { staker }
                          </span>
                          <input
                            type="checkbox"
                            className="modal-checkbox w20r"
                            selected= { ownProof[stakerNo] }
                            onClick= {()=>{
                              let choice = !ownProof[stakerNo];
                              if (choice)
                                setOwnProof (ownProof.concat(stakers[stakerNo]))
                              else
                                setOwnProof( ownProof.map((tick,idx)=> (idx===stakerNo ? choice : tick) && stakers[stakerNo] ).filter(Boolean) );
                              console.log('Setting:', choice, stakerNo, stakers[stakerNo], ownProof, ownProof.concat(stakers[stakerNo]), ownProof.map((tick,idx)=> (idx===stakerNo ? choice : tick) && stakers[stakerNo] ) );
                            }}
                          />
                        </div>
                      )}
                      <button
                        className = { cN('modal-button', 'modal-button__form-button') }
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
                    buttonText= { modalView==='venue refund' ? 'Cool!' : 'Whoop whoop!' }
                    loadingText= { modalView==='venue refund' ? 'Waiting for refund confirmations' : `Current rep: ${repWas}. Updating...` }
                    loading = { modalView==='venue refund'
                      ? !caughtEvents.filter(event=> event.eventName==='venuePotDisbursed').length
                      : !caughtEvents.filter(event=> event.eventName==='repRefund' && "event.returnValues.staker===ownAddress").length
                    }
                  >
                  { modalView==='venue refund'
                  ? <>
                    <div className="hype-small">Refunded to:</div>
                    { caughtEvents
                        .filter(event=> event.eventName==='venuePotDisbursed')
                        .map (event=>{
                          const { returnValues } = event;
                          const { amount, by, to } = returnValues;
                          return <div className={ cN("w100") }>
                            <span className={ cN("address42", "w70") }>{ to } </span>
                            <span className={ cN("address42", "w30r") }>
                              <div className={ cN("hype") }>{ niceNum(amount/1000) }k TT</div>
                            { price &&
                              <div className={ cN("hype-small","sub-right") }> (USD { niceNum(amount*price) })</div>
                            }
                            </span>
                         </div>
                         /*
                          TODO: add responsive alternative to hype, hype-small

                         */
                       })
                     }
                  </>
                : <>
                    <div className={ cN("modal-info__header", "w100", "hype-small") }> Reputation update </div>
                    { caughtEvents
                        .filter(event=> event.eventName==='repRefund' && 'event.returnValues.staker===ownAddress')
                        .map (event=>{
                          const { returnValues } = event;
                          const { staker, staked, refunded } = returnValues;
                          return <>
                            <div className={ cN("hype-small", "w70") }>Your rep was: {repWas/1000} </div>
                            <div className="w70"><span className="hype-small">+ stake</span>({repStaked/1000}) X {repMultiplier} = <span className="hype-small">{repStaked/1000*repMultiplier} </span></div>
                            { updatedRep && updatedRep>=maxRep &&
                              <div className="w70"><span className="hype-small">Maximum rep</span>: <span className="hype-small">{maxRep} </span></div>
                            }
                            <div>Your rep is now:
                              <span className={ cN("hype") }>
                                {'  '}{ updatedRep===null ? <Dots /> : updatedRep }
                              </span>
                            </div>
                          </>
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
    { true &&
      <AdminLogger ownAddy={ ownAddress } />
    }
  </>)
}

export default LiveEvent;
