import React, { useEffect, useState } from "react";
import { ConnectionError } from "web3";

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
import ChoosePollView from "./ChoosePollView";
import {Form} from "react-bootstrap";

// import {LiveEvent} from "./LiveEvent";
import "../App.scss";


// import { owner } from './segregatedPanel/formConfig'
const eventsObj = {};
const resolvers = {}

const LunchcoinApp = props => {
  // const [ownAddy, setOwnAddy] = useState('0xLA');
  const { setOwnAddyParent } = props;
  const [noChainError, setNoChainError] = useState(false);
  const [pollUrls, setPollUrls] = useState([]);   // unsorted
  const [polls, setPolls] = useState([]);         // objects, sorted
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
  // const [currentContractAddress, setCurrentContractAddress] = useState('');
  // const [alternateContractAddress, setAlternateContractAddress] = useState('');


  // TODO: it would be nivce to have a more async aware version of addToChoices, that doesn't refetch all each time a poll is added
  const addToChoices = pollUrl => {
    fetchAndUpdatePolls(pollUrls.concat(pollUrl));
    setPollUrls(pollUrls.concat(pollUrl));
  }

  // const chainEventListeners = {
  //   getPoll : eventResponse => { console.log(eventResponse); },
  //   proofsWindowClosed : eventResponse => { console.log('proofsWindowClosed', eventResponse); },
  // }

  const getLocalCache= ()=> {
    return ['doodle.com/poll/h7phtw5u2thhz9k4'];
    return ['doodle.com/poll/h7phtw5u2thhz9k4', 'doodle.com/poll/r9rb35fiibvs3aa5'];
  }

// Take an object with objects appearing twice, first under numerical keys with correct JS type,
//   ​then under alphanum keys with possibly string type, and return alphanum keys and correct types.

  const fetchAndUpdatePolls = (pollUrls)=> {
    let sortedPolls = polls.slice();
    const getSortedPolls=()=> sortedPolls;

    return Promise.all( pollUrls.map (url=> new Promise(resolve=>{
      console.log('Promise',url);
      callTransaction('getPoll', { _poll: url })
        .then (async response=> {
          response.url = url;
          sortedPolls = sortedPolls
            .filter( knownPoll=> knownPoll.url != url )
            .concat( [unixifyTimes(response)] )
            .sort( byStartEndSort )

          console.log(sortedPolls);
          setPolls (sortedPolls);
          resolve(getSortedPolls);
        });
    })))
    // Promise.all should have resolved with an array of identical references to the sortedPolls array
    .then(getSortedPolls=> {
      if (sortedPolls.length) {
        const sortedPolls = getSortedPolls[0]();
        // quick sanity check of the comment above :/
        if(getSortedPolls.map(fn=>fn().length).some(len=>len!=sortedPolls.length))
          console.log('Uh oh:',getSortedPolls.map(fn=>fn().length));
        const liveOnes = sortedPolls.filter(poll=> (poll.end>Date.now() && poll.start<Date.now()) );
        setLivePolls(liveOnes);

        // *****
        // delete me!
        setLivePolls(sortedPolls);
        // *****
        console.log(sortedPolls);


        if (!currentPoll && liveOnes.length) {
          if (liveOnes.length === 1)
            setCurrentPoll(liveOnes[0])
          else
            setChoosePoll(true);
        };
      }
    });
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

  const toUnixTime = x=>x;

  // not strictly Unix ;) Using end==0 to signify end==never. Don't rely on this!
  const unixifyTimes = resp=>
    Object.assign (resp,
      { start : resp.start ? toUnixTime(resp.start) : resp.start },
      { end : resp.end ? toUnixTime(resp.end) : (resp.end==0) ? Infinity : resp.end },
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
    const knownUrls = getLocalCache()
    setPollUrls(knownUrls);

    let tempRead = [];
    let tempWrite = [];
    setLoadingStatus(true);

    connectToWeb3().then(addressObj => {
      console.log(addressObj)
      // setCurrentContractAddress(addressObj.IMPLEMENTATION_ADDRESS)
      // setAlternateContractAddress(addressObj.unImplementedAddress)
      return true
    }).then( ()=> {
      console.log(`will: fetchAndUpdatePolls(pollUrls) with:`,knownUrls);
      fetchAndUpdatePolls(knownUrls);
      // getImplementationEvents({  pollUrl:undefined, setWatchers:true }, chainEventListeners)
      getImplementationEvents()
        .then (foundEvents=> {
          console.log(foundEvents);
          foundEvents.forEach( event=> {
            eventsObj[event.eventName]={signature : event.signature};
          });
        setEvents(eventsObj);
      });

      setLoadingStatus(false);
    })
      .catch(err=> {
        if (err.message==='connection not open on send()' || err instanceof ConnectionError)
          setNoChainError(true);
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
        { noChainError
          ? 'Unable to reach blockchain endpoint'
          : (currentPoll
              ? <LiveEvent pollUrl={currentPoll} setOwnAddyParent={ setOwnAddyParent }/>
              : loadingStatus
                ? <Loading heading={"Loading Contract..."}/>
              : <ChoosePollView
                  polls={ polls }
                  addToChoices={ addToChoices }
                  livePolls={ livePolls }
                  setPolls = { setPolls }
                  setCurrentPoll = { setCurrentPoll }
                />
            )
        }
      </Container>
  );
};


export default LunchcoinApp;
