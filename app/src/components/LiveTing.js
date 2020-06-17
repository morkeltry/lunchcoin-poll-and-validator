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
  callTransaction, sendTransaction, getFromStorage,
  myAccounts, setOwnAddy } from "../Web3/accessChain";

const LiveEvent = props => {
  const { pollUrl, events,  } = props;
  if (!pollUrl)
    throw ('Attempted to render LiveEvent with pollUrl='+pollUrl);
  let OWN_ADDRESS = '0x000';

  const [modalView, setModalView] = useState(null);
  const [burgerView, setBurgerView] = useState(false);
  const [hideFunctions, setHideFunctions] = useState(true);
  const [pollName, setPollName] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState(['0x1234','0x5678']);
  const [contractAddy, setContractAddy] = useState(OWN_ADDRESS);
  const [ownAddy, setOwnAddyinComponent] = useState(OWN_ADDRESS);
  const [caughtEvents, setCaughtEvents] = useState([]);
  const [sentTransaction, setSentTransaction] = useState();
  const [checkedIn, setCheckedIn] = useState(false);
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

// TODO: setCheckedIn setOwnProof setRepWas setInfoModalResult

  const proofMismatchMessage = ()=> 'attendees are not in your check-in proof!'

// ----------------------- functions for useEffect

  const setOwnAddyForApp = addy=> {
    setOwnAddy(addy);
    setOwnAddyinComponent(addy);
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


  const fetchAndUpdate = (freshAddy = ownAddy )=> {
    callTransaction('getproofsAsAddresses', {_poll : pollUrl})
      .then(response=>{
        console.log('getproofsAsAddresses', response);
        setProofs(response);
        if (response.includes(freshAddy))   // makes no sense with new structure.
          setCheckedIn(true);
      })
      .catch(err=>{console.log(err);});

    // Instead get proof(OwnAddy) from storage
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
        console.log(`Initial fetchandupdate gave setYouPaidForVenue= ${youPaidForVenue} (${response.total},${response[0]},${response})`);
        setYouPaidForVenue(response.total || (Array.isArray(response) && (response[0])) || response);
      })
      .catch(err=>{console.log('err:',err);});
    callTransaction('getPoll', {_poll : pollUrl })
      .then(response=>{
        console.log('getPoll', response);
        console.log(`Initial fetchandupdate gave getPoll= ${youPaidForVenue} (${response.total},${response[0]},${response})`);
        setVenueCost(response.venueCost);
        setVenuePot(response.venuePot);
        setCheckInIsClosed(response.proofsWindowClosed);
      })
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

  }



// ----------------------- chain access functions (other than those above for useEffect)

  // NB proof (_newProof) will eventually be more complex than an addy;
  // NB _impersonatedStaker is a temporary expedient for testing which will be removed
  const submitProof = ()=> {
    const _newProof = ownProof;
    const _impersonatedStaker = ownAddy;   // !!
    // Not yet implemented in contract!
    setModalView(null);
    sendTransaction('addProof', {_poll: pollUrl, _newProof: ownProof, _impersonatedStaker })   // ownAddy is hack for demo - validator will be more complex than this!
      .then(response=>{

        // getfrom storage proofs(ownaddy)
        //     setCheckedIn(true);

        let getproofsAsAddressesIsOK = true;
        if (getproofsAsAddressesIsOK)
        callTransaction('getproofsAsAddresses', {_poll : pollUrl})
          .then(response=>{
            console.log('setting CheckedIn');
            setProofs(response);
            setCheckedIn(true);
          })
          .catch(err=>{ console.log(`getproofsAsAddresses failed`, err); });
      });
  }


  const closeCheckin = ()=> {
    sendTransaction('closeProofsWindow', {_poll : pollUrl })
      .then(response=>{
        console.log('closeProofsWindow',response);
        callTransaction('isProofsWindowClosed', {_poll : pollUrl })
        .then(response=>{
          console.log('isProofsWindowClosed: pollData(pollUrl)',response);
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
        setTimeout(()=>{
        callTransaction('totalRepStaked', {_poll: pollUrl, _staker: ownAddy })
          .then(response=>{
            console.log(response);
            setRepStaked( response )
          })
        },500)
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
      console.log(addressObj);
      console.log('which one is ownAddy, which is IMPLEMENTATION_ADDRESS?' );
      setOwnAddyForApp(addressObj.OWN_ADDRESS);
      setContractAddy(addressObj.IMPLEMENTATION_ADDRESS);
      setAvailableAccounts(addressObj.availableAccounts);
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
        .forEach(address=>{ result[address]=()=>{ setOwnAddyForApp(address); console.log(address); } }) ;
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
              ...accountSetters(availableAccounts,4),
              'Fetch from chain' : ()=>{ fetchAndUpdate(); },
              'Hide Menu' : ()=>{ setBurgerView(false); }
            }
          }}
        />

        <Section
          id='checkin'
          buttonSuper= { `You are ${ checkedIn ? '' : 'not ' }checked in` }
          buttonText= { checkedIn ? 'Update check-in proofs' : 'Check In' }
          buttonAction= { ()=>{ setModalView('check in') } }
          buttonDisabled= { checkInIsClosed || !checkInClosingIn(checkInCloses) }
        >
          <div className="strong left-align">
            <span className="address42"> { ownAddy } </span> (you)
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
          buttonSuper= { checkedIn ? 'Reclaim your rep once check-in is closed' : 'Check in to reclaim your rep' }
          buttonText= { !repStaked ? 'Unstake me now' : `Your reputaion is restored 😎` }   // U+1F60E}
          buttonText= { 'Unstake me now' }
          buttonAction= { claimRep }
          buttonDisabled= { !checkedIn || !checkInClosingIn(checkInCloses) }
          sectionHidden= { !repEverStaked }
        >
          <div className="strong right-align">
            You staked <span className="hype hanging"> { niceNum(repStaked/1000) } Rep </span>
          </div>
        </Section>

        <Section
          id='venue-refund'
          buttonText= { venueRefundDue(venueCost,youPaidForVenue)
            ? `Refund ${niceNum(venueRefundDue(venueCost,youPaidForVenue)/1000)} TT-DAI`
            : `We're all square 😎`   // U+1F60E
          }
          buttonAction= { venueRefundDue(venueCost,youPaidForVenue) && doVenueRefund }
          buttonDisabled= { null  }  // NB In order to keep it visible, the buttonAction is disabled with && instead.
          sectionHidden= { !youPaidForVenue }
        >
          <div className="centre-align">
            Venue cost was { niceNum(venueCost)/1000 } TT-DAI
          </div>
          <div className="centre-align">
            You paid <span className="hype hype-small">{ niceNum(youPaidForVenue)/1000 } TT-DAI</span>
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
                    <div key={staker}>
                      <span className="address42">
                        { staker }
                      </span>
                      <input
                        type="checkbox"
                        selected= { ownProof[idx] }
                        onClick= {()=>{
                          ownProof[idx] = !ownProof[idx];
                          setOwnProof( ownProof.map((tick,idx)=>tick&&stakers[idx]).filter(Boolean) );
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
                <div>+ stake({repStaked/1000}) X {repMultiplier} = {repStaked/1000*repMultiplier} </div>
                <div>Your rep is now: {infoModalResult} </div>
              </>

              }
              </InfoModal>
          )
        }



    </div>
    { true &&
      <AdminLogger { ...ownAddy } />
    }
  </>)
}

export default LiveEvent;
