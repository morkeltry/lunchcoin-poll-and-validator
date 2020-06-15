import React, { useState, useEffect } from 'react';
import cN from 'classnames';

import Header from "./Header";
import Section from "./Section";
import InfoModal from "./InfoModal";
import FormModal from "./FormModal";
import LogoBottom from "./LogoBottom";
import AdminLogger from "./AdminLogger";

import "../App.scss";
import './checkInView.css';

import { connectToWeb3, getImplementationFunctions, getImplementationEvents,
  callTransaction, sendTransaction, getFromStorage } from "../Web3/accessChain";

const LiveEvent = props => {
  const { pollUrl } = props;
  if (!pollUrl)
    throw ('Attempted to render LiveEvent with pollUrl='+pollUrl);
  let OWN_ADDRESS;

  const [modalView, setModalView] = useState(null);
  const [pollName, setPollName] = useState('');
  const [ownAddy, setOwnAddy] = useState(OWN_ADDRESS);
  const [caughtEvents, setCaughtEvents] = useState([]);
  const [sentTransaction, setSentTransaction] = useState();
  const [checkedIn, setCheckedIn] = useState(true);
  const [checkInCloses, setCheckInCloses] = useState(Infinity);
  const [checkInIsClosed, setCheckInIsClosed] = useState(null);
  const [stakers, setStakers] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [ownProof, setOwnProof] = useState([]);
  const [repStaked, setRepStaked] = useState();
  const [repEverStaked, setRepEverStaked] = useState();
  const [venueCost, setVenueCost] = useState(0);
  const [venuePot, setVenuePot] = useState(0);
  const [youPaidForVenue, setYouPaidForVenue] = useState(0);
  const [mismatchedProofs, setMismatchedProofs] = useState([]);
  const [repWas, setRepWas] = useState(0);
  const [repMultiplier, setRepMultiplier] = useState(1.25);
  const [infoModalResult, setInfoModalResult] = useState(null);
  // const [, set] = useState();
  const [validator1PeerCheckedIn, setValidator1PeerCheckedIn] = useState([[ OWN_ADDRESS, true ]]);

  const proofMismatchMessage = ()=> 'attendees are not in your check-in proof!'

// ----------------------- functions for useEffect

  const getLocalCache =()=> {

  }

  const fetchOnlinePoll = (pollUrl)=> {
    setPollName(`Let's go to the beach!!`);
    // fetch(pollUrl)
    //   .then (resp=> resp.xml)
    //   .then (pull out name, etc.)
    //   .then (setPollName) ;
  }


  const fetchAndUpdate = (freshAddy = ownAddy )=> {
    callTransaction('getproofsAsAddresses', {_poll : pollUrl})
      .then(response=>{
        console.log('getproofsAsAddresses', response);
        setProofs(response);
        if (response.includes(freshAddy))
          setCheckedIn(true);
      })
      .catch(err=>{console.log(err);});
    callTransaction('getStakerAddresses', {_poll : pollUrl})
      .then(response=>{
        console.log('getStakerAddresses', response);
        setStakers (response);
      })
      .catch(err=>{console.log(err);});
    callTransaction('totalRepStaked', {_poll : pollUrl, _staker : freshAddy || ownAddy })
      .then(response=>{
        console.log('totalRepStaked', response);
        setRepStaked(response);
        setRepEverStaked(response);
      })
      .catch(err=>{console.log(err);});
    callTransaction('totalVenueContribs', {_poll : pollUrl, _staker : freshAddy || ownAddy })
      .then(response=>{
        console.log('totalVenueContribs', response);
        setYouPaidForVenue(response);
      })
      .catch(err=>{console.log('err:',err);});
    getFromStorage('pollData', pollUrl)
      .then(response=>{
        console.log('getFromStorage: pollData(pollUrl)',response);
        setVenueCost(response.venueCost);
        setVenuePot(response.venuePot);
      });
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

  }



// ----------------------- chain access functions (other than those above for useEffect)

  // NB proof (_newProof) will eventually be more complex than an addy;
  // NB _impersonatedStaker is a temporary expedient for testing which will be removed
  const submitProof = ev=> {
    // ev.preventDefault();
    // const _newProof; // not!!
    const _newProof = ownProof;
    const _impersonatedStaker = ownAddy;   // !!
    // Not yet implemented in contract!
    setModalView(null);
    console.log({_poll: pollUrl, _newProof: ownProof, _impersonatedStaker });
    sendTransaction('addProof', {_poll: pollUrl, _newProof: ownProof, _impersonatedStaker })   // ownAddy is hack for demo - validator will be more complex than this!
      .then(response=>{
        callTransaction('getproofsAsAddresses', {_poll : pollUrl})
          .then(response=>{
            console.log(response);
            // setProofs
            // setCheckedIn
          });
      });
  }


  const closeCheckin = ()=> {
    sendTransaction('closeProofsWindow', {_poll : pollUrl })
      .then(response=>{
        console.log('closeProofsWindow',response);
        getFromStorage('pollData', pollUrl)
        .then(response=>{
          console.log('getFromStorage: pollData(pollUrl)',response);
          setCheckInIsClosed(response.proofsWindowClosed);
        });
      });
  }

  const emptyBytes32 = '0x00';
 // refundStake (string memory _poll, bytes32 _reveal)

  const claimRep = ()=> {
    // Not yet implemented in contract!
    setSentTransaction([Date.now(),'reclaim rep']);
    sendTransaction('refundStake', {_poll: pollUrl, _reveal: emptyBytes32 })
      .then(response=>{
        callTransaction('totalRepStaked', {_poll: pollUrl, _staker: ownAddy })
          .then(response=>{
            console.log(response);
            setRepStaked( response )
          })
      })
  }

  const doVenueRefund = ()=>{
    setModalView('venue refund');
    setSentTransaction([Date.now(),'venue refund']);
    sendTransaction('refundVenueStakes', {_poll: pollUrl } )
      .then (response => {
        // ignore response.transactionHash
        [0,250,500].forEach(ms=> {
          setTimeout(()=>{
            console.log(`${ms}ms: ${caughtEvents.length}`,caughtEvents);
        }, ms);
        console.log(`Response ${Date.now()-sentTransaction[0]}ms after ${sentTransaction[1]} sent.`);
        setTimeout( ()=>{ setCaughtEvents([]) }, 501);
      })
      .catch (err => {
        console.log(err);
      });

    });
  }

// ----------------------- useEffect

  useEffect(()=> {
    getLocalCache();
    fetchOnlinePoll(pollUrl);
    connectToWeb3().then(addressObj => {
      console.log(addressObj)
      console.log('which one is OWN_ADDRESS, which is IMPLEMENTATION_ADDRESS?' );

      setOwnAddy(addressObj.IMPLEMENTATION_ADDRESS)
      return addressObj.IMPLEMENTATION_ADDRESS
    }).then(addy=> {
      fetchAndUpdate(addy);
    })

  }, []);



// ----------------------- helpers

    const toUnixTime = x=>x;

    const unixifyTimes = resp=>
      Object.assign (resp,
        { start : resp.start ? toUnixTime(resp.start) : resp.start },
        { end : resp.end ? toUnixTime(resp.end) : resp.end },
      );

    const niceNum = (num=0) =>
      (Math.round(num*1000)/1000).toString() ;

    const niceTime = (time=498705720) =>
      time < Infinity
        ? new Date(time).toTimeString().slice(0,14)
        : 'Never' ;

    const checkInClosingIn = checkinCloses=>
      Math.max (checkinCloses-Date.now(), 0) ;


    // Make it pure?
    const venueRefundDue = ()=>{

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

    const asSubmit = fn=> ev=> {
      ev.preventDefault();

      console.log(ev);
       // you're accessing the property `target` on a released/nullified synthetic event.
       // This is set to null. If you must keep the original synthetic event around,
       //  use event.persist().
      fn (ev.formArgs);
    }



console.log((checkInCloses));
console.log(checkInClosingIn(checkInCloses));
return(<>
    <div className={'checkin-view'}>

        <Header
          live={true}
          pollName={pollName}
          pollUrl={pollUrl}
        />

        <Section
          id='checkin'
          buttonSuper= { `You are ${ checkedIn ? 'not ' : '' }checked in` }
          buttonText= { checkedIn ? 'Check In' : 'Update check-in proofs' }
          buttonAction= { ()=>{ setModalView('check in') } }
          buttonDisabled= { checkInIsClosed || !checkInClosingIn(checkInCloses) }
        >
          <div className="strong left-align">
            <span className="address42"> { ownAddy } </span> (you)
          </div>
          <div className="strong right-align">
            staked <span className="hype hanging"> { niceNum(repStaked) } Rep </span>
          </div>
        </Section>

        <div className="full-width thin-section">
          { niceTime(checkInCloses)
            ? `Hurry Hurry, check-in closing, yo! (${ niceTime(checkInCloses) })`
            : 'Check-in is closed'
          }

        </div>

        { mismatchedProofs.length && checkedIn &&
            <Section
              id='proof-mismatch'
              error = { true }
              buttonText= { 'Update check-in proofs' }
              buttonAction= { ()=>{ setModalView('check in') }}
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
          buttonSuper= { checkInClosingIn(checkInCloses) ? 'Close check-in cannot be undone' : '' }
          buttonText= { 'Close check-in' }
          buttonAction= { closeCheckin }
          buttonDisabled= { null && (checkInIsClosed || proofs.length < stakers.length )}
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
          buttonSuper= { checkedIn ? 'Reclaim your rep once check-in is closed' : 'Check in to reclaim your rep' }
          buttonText= { !repStaked ? 'Unstake me now' : `Your reputaion is restored 😎` }   // U+1F60E}
          buttonText= { 'Unstake me now' }
          buttonAction= { claimRep }
          buttonDisabled= { !checkedIn || !checkInClosingIn(checkInCloses) }
          sectionHidden= { !repEverStaked }
        >
          <div className="strong right-align">
            You staked <span className="hype hanging"> { niceNum(repStaked) } Rep </span>
          </div>
        </Section>

        <Section
          id='venue-refund'
          buttonText= { venueRefundDue(venueCost,youPaidForVenue)
            ? `Refund ${niceNum(venueRefundDue(venueCost,youPaidForVenue))} TT-DAI`
            : `We're all square 😎`   // U+1F60E
          }
          buttonAction= { venueRefundDue(venueCost,youPaidForVenue) && doVenueRefund }
          buttonDisabled= { null  }  // NB In order to keep it visible, the buttonAction is disabled with && instead.
          sectionHidden= { !youPaidForVenue }
        >
          <div className="centre-align">
            Venue cost was { niceNum(venueCost) } TT-DAI
          </div>
          <div className="centre-align">
            You paid <span className="hype hype-small">{ niceNum(youPaidForVenue) } TT-DAI</span>
          </div>
        </Section>

        <LogoBottom/>

        { modalView &&
          ( modalView==='check in'
            ? <FormModal
                modal = { modalView }
                clearModal= { ()=>{ setModalView(null) } }
                submit= { submitProof  /*NB not yet implemented in FormModal - see submit below */ }
              >
                <div>{ ownAddy }</div>
                <div className=""><span className="">Validator:</span><span className=""> Mutual Agreement</span></div>
                <div className="">Check in your friends</div>
                <form>
                  { stakers.map((staker,idx)=>
                    <div>
                      <span className="address42">
                        { staker }
                      </span>
                      <input
                        type="checkbox"
                        selected= { ownProof[idx] }
                        onClick= {()=>{
                          ownProof[idx] = !ownProof[idx];
                          setOwnProof(ownProof);
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
                clearModal= { ()=>{ setInfoModalResult(null); setModalView(null) } }
                buttonText= { modalView==='venue refund' ? 'Cool!' : 'Whoop whoop!' }
                loadingText= { modalView==='venue refund' ? 'Waiting for refund confirmations' : `Current rep: ${repWas}. Updating...` }
              >
              { modalView==='venue refund'
              ? <>
                <div>Refunded to:</div>
                { infoModalResult.map (refund=>(
                  <div>
                    <span className="address42">{ refund.addess }</span>
                    <span className="hype">{ refund.amount } TT-DAI</span>
                 </div>
               ))}
              </>
              : <>
                <div>Your rep was: {repWas} </div>
                <div>+ stake({repStaked}) X {repMultiplier} = {repStaked*repMultiplier} </div>
                <div>Your rep is now: {infoModalResult} </div>
              </>

              }
              </InfoModal>
          )
        }



    </div>
    { true &&
      <AdminLogger { ...OWN_ADDRESS } />
    }
  </>)
}

export default LiveEvent;
