import React, { useEffect, useState } from "react";
import  { useGlobal } from "reactn";

import {connectToWeb3, getImplementationFunctions, getImplementationEvents,
  callTransaction, myAccounts, switchTo} from "../Web3/accessChain";
// import SegregatedPanel from "./segregatedPanel/SegregatedPanel";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Col from "react-bootstrap/Col";
import Loading from "./Loading";
import LiveEvent from "./LiveTing";
import {Form} from "react-bootstrap";

// import {LiveEvent} from "./LiveEvent";
import "../App.scss";


// import { owner } from './segregatedPanel/formConfig'
const pollUrls = ['doodle.com/poll/h7phtw5u2thhz9k4', 'doodle.com/poll/r9rb35fiibvs3aa5'];
const eventsObj = {};

const LunchcoinApp = props => {
  // const [ownAddy, setOwnAddy] = useState('0xLA');
  const { setOwnAddyParent } = props;
  const [polls, setPolls] = useState([]);
  const [livePolls, setLivePolls] = useState([]);
  const [currentPoll, setCurrentPoll] = useState('doodle.com/poll/r9rb35fiibvs3aa5');
  const [choosePoll, setChoosePoll] = useState(true);
  // const [, set] = useState();
  // const [, set] = useState();
  // const [, set] = useState();

  // NB In a horrific reprototyping of the English language,
  // events as in 'locations where humans gather by arrangement' will be known as 'polls',
  // except where the object name unambiguosuly could not refer to a computery event.
  const [events, setEvents] = useState(eventsObj);
  const [caughtEvents, setCaughtEvents] = useState([]);
  const [checkInIsClosed, setCheckInIsClosed] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [currentContractAddress, setCurrentContractAddress] = useState('');
  const [alternateContractAddress, setAlternateContractAddress] = useState('');

  const chainEventListeners = {
    getPoll : eventResponse => { console.log(eventResponse); },
    proofsWindowClosed : eventResponse => { console.log('proofsWindowClosed', eventResponse); },
  }

  const getLocalCache =()=> {

  }

// Take an object with objects appearing twice, first under numerical keys with correct JS type,
//   ​then under alphanum keys with possibly string type, and return alphanum keys and correct types.

  const fetchAndUpdatePolls = (pollUrls)=>
    Promise.all( pollUrls.map (poll=> new Promise(resolve=>{
      callTransaction('getPoll', { _poll: poll })
        .then (async response=> {
          response.url = poll;
          await setPolls (
            polls
              .filter( knownPoll=> knownPoll.url != poll )
              .concat( [unixifyTimes(response)] )
              .sort( byStartEndSort )
          );
        });
        resolve();
    })))
    .then(async ()=> {
      await setLivePolls (
          polls.filter(poll=> (poll.end>Date.now() && poll.start<Date.now()))
      );
      if (!currentPoll && livePolls.length) {
        if (livePolls.length === 1)
          setCurrentPoll(livePolls[0])
        else
          setChoosePoll(true);
      };
    });


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

  const toUnixTime = x=>x;

  const unixifyTimes = resp=>
    Object.assign (resp,
      { start : resp.start ? toUnixTime(resp.start) : resp.start },
      { end : resp.end ? toUnixTime(resp.end) : resp.end },
    );

  const byStartEndSort = event=>{
    const {start, end} = unixifyTimes(event);
    const now = Date.now();
    const endsIn = end-Date.now();
    if (endsIn<24*3600 && (endsIn>-3600 || start<Date.now()))
      return end-start
    if (endsIn<24*3600)
      return start-1500000000000
    return 2000000000000-end
  }



  useEffect(()=> {
    getLocalCache();

    let tempRead = [];
    let tempWrite = [];
    setLoadingStatus(true);
    connectToWeb3().then(addressObj => {
      console.log(addressObj)

      setCurrentContractAddress(addressObj.IMPLEMENTATION_ADDRESS)
      setAlternateContractAddress(addressObj.unImplementedAddress)
      return true
    }).then( ()=> {
      fetchAndUpdatePolls(pollUrls);
      getImplementationEvents({ setWatchers:true }, chainEventListeners)
        .then (foundEvents=> {
          console.log(foundEvents);
          foundEvents.forEach( event=> {
            eventsObj[event.eventName]={signature : event.signature};
          });
        setEvents(eventsObj);
      });

      setLoadingStatus(false);
    })

  }, []);

  const switchContract = (e) => {
    console.log(e.target.value)
    switchTo(e.target.value).then(()=>{
      window.location.reload()
    })

  }

  return (
      <Container fluid={"true"} className={"height-100vh"} >
        { currentPoll
          // ? <LiveEvent event={currentPoll} />
          ? <LiveEvent pollUrl={currentPoll} checkInIsClosed={true} setOwnAddyParent={ setOwnAddyParent }/>
          : choosePoll
            ? livePolls.map((poll,idx)=>(
                <Row>
                  event{ idx }
                </Row>
              ))
            : <Loading heading={"No events found. Please link to a poll."}/>


        }

        {loadingStatus ? (
            <Loading heading={"Loading Contract..."}/>
        ) : (
            <Row>

            </Row>
        )}
      </Container>
  );
};


export default LunchcoinApp;
