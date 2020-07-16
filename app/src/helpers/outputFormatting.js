import { fetchOnlinePoll } from './doodleFetchers.js';

// // internal logging:
//     event logStuff (string)
//     event emptyStakeRemoved (string poll, address staker);
//
// // events affecting all stakers
//     event newPollCreated(string poll);
//     event eventTimeSet(string poll, uint start, uint end);
//     event eventStakingClosed(string poll, uint at);
//     event proofsWindowClosed (string poll, address by);
//
// // events affecting one or more stakers, which may be triggered by the staker or someone else
//     // NB fields are from and to, not staker
//     event venuePotDisbursed (string poll, address to, address by, uint amount);
//     event stakeReleased (string poll, address staker);
//     event stakeLocked (string poll, address staker);
//
// // success / failure events affecting one staker, triggered by the staker attempting a chain action
//     event staked(address staker, string poll, uint amount);
//     event stakeNotAccepted(address staker, string poll);
//     event disreputableStakerIgnored(address staker, string poll);
//     event proofUpdated(address staker);
//     event repRefund (address staker, uint staked, uint refunded);
//     event refundFail (address staker);
//     event expiryWasSet(string poll, address staker, uint availabilityExpires);
//     event availabilityAdded(string poll, address staker, uint start, uint end);
//     // NB (future functionality) - may affect another staker, but the field will be beneficiary, not staker
//     event madeVenueContribution(address staker, string poll, uint amount);

const state={
  eventTimes: {},
  pollName: {},
};

const loggingEvents = ['logStuff', 'emptyStakeRemoved' ];
const broadcastEvents = ['newPollCreated', 'eventTimeSet', 'eventStakingClosed', 'proofsWindowClosed' ];
const thirdPartyEvents = ['venuePotDisbursed', 'stakeReleased', 'stakeLocked', 'thirdPartyRepMined' ]; // thirdPartyRepMined is a fake event!
const firstPartyEvents = [
  'staked', 'Placed a stake', 'stakeNotAccepted',   // chain events
  'disreputableStakerIgnored',                      // fakeable chain event
  'zeroStakeAttempt', 'venuePaidWithNoRepStake',    // fake events
  'proofUpdated', 'repRefund', 'refundFail', 'expiryWasSet', 'availabilityAdded', 'madeVenueContribution'
];

const releaseStateIfOver = maxSize=> {
  Object.keys(state).forEach (key=>{
    if (Object.keys(state[key]).length > maxSize){
      delete state[key];
      state[key]={};
    }
  });
}

let gcCheck = 0;

const wait = async ms=> new Promise( resolve=> {
  setTimeout(()=>{ resolve() }, ms)
})

const putState = (key1, index, value)=> {
  if (gcCheck>100) {
    releaseStateIfOver(1000);
    gcCheck = 0;
  }
  state[key1][index] = value;
}

export const eventToastOutputLongFake = (toastView, ownAddy)=> {
  return { // toastView && {
    header: toastView.event || 'Some event happened!',
    text: `New stakeable poll at ${toastView.poll}\nStake your Lunchcoin rep tokens on the times you are available to attend`
  }
}

export const eventToastOutput = (tv, ownAddy)=> {
  const toastView = tv || {};
  const emptyResult = { header: null, text: null };
  const result = emptyResult;

  if (!tv)
    return emptyResult
  if ( loggingEvents.includes(toastView.event)) {
    return emptyResult
  };
  if ( firstPartyEvents.includes(toastView.event)) {
    console.log(`Formatting output for caught first party event: ${toastView.event}`, toastView);
    switch (toastView.event) {
      case 'Placed a stake' :
        let { stake } = toastView;
        result.header = stake
          ? 'Placed a stake'
          : 'Try again!'
        result.text = stake
          ? `You placed a stake ( ${niceNum(toastView.stake/1000)} rep )${ toastView.totalRepStaked==stake ? '' : `\nTotal rep staked: ${niceNum(toastView.totalRepStaked/1000)} `}`
          : 'Your rep stake did not place. Check the form fields'
        break;
      case 'repRefund' :
        result.header='Rep stake returned';
        result.text=`Your staked reputation was reclaimed. Staked:${niceNum(toastView.staked/1000)}, Returned:${niceNum(toastView.refunded/1000)}`;
        console.log('SHould pass to Toast:', result);
        break;
      case 'disreputableStakerIgnored' :
        result.header='Your reputation is shot :P';
        result.text=`(or maybe you're just a new Lunchcoin user, in which case, welcome ;)\nYou cannot stake because you have insufficient reputation.\n Check the Public Events tab for the next event you can attend to top up your rep.`;
        console.log('Should pass to Toast:', result);
        break;
      case 'zeroStakeAttempt' :
        result.header = 'Zero stake attempt'
        result.text = `You cannot place a stake with zero rep.\nPlease reenter your stake amount`;
        break;
      case 'venuePaidWithNoRepStake' :
        result.header='You made a venue contribution. Thanks! ';
        result.text=`You contributed ${kiloNiceNum(toastView.venueContrib/1000)}TT for the venue
                      ${ toastView.beneficiary ? ` on behalf of ${toastView.beneficiary}.` : '' }\nYou will not be a staker on the poll unless you have also staked rep. You can do this with a separate stake`;
        console.log('SHould pass to Toast:', result);
        break;
      default :
        return emptyResult
    }
    console.log(`returning ${result}`,result);
    return result
  };
  if ( broadcastEvents.includes(toastView.event)) {
    console.log(`Formatting output for caught broadcast event: ${toastView.event}`, toastView);
    switch (toastView.event) {
      case 'newPollCreated' :
        // await Promise.race([
        //   wait(750),
        //   fetchOnlinePoll.then(pollName=>{
        //     putState('pollName', toastView.poll, pollName);
        //   })
        // ]);
        result.header=`New Poll${state.pollName[toastView.poll] && ` - ${state.pollName[toastView.poll]}`} created}`;
        result.text=`New stakeable poll at ${toastView.poll}\nStake your Lunchcoin rep tokens on the times you are available to attend`;
        break;
      case 'eventTimeSet' :
        result.header='Event time has been set';
        result.text=`${sensibleDateTime([toastView.start, toastView.end]).join(' - ')}`;
        putState('eventTime', toastView.poll, {start: toastView.start, end: toastView.end} );
        break;
      case 'eventStakingClosed' :
        return emptyResult
        result.header='';
        result.text=``;
        break;
      case 'proofsWindowClosed' :
        result.header='Check-in closed';
        result.text=`Check-ins can no longer be updated for poll ${toastView.poll}`;
        break;
      default :
        return emptyResult
    }
    return result
  };
  if ( thirdPartyEvents.includes(toastView.event)) {
    console.log(`Formatting output for caught third party event: ${toastView.event}`, toastView);
    switch (toastView.event) {
      case 'venuePotDisbursed' :
        result.header='Some of your venue contribution was refunded';
        result.text=`Called by ${ toastView.by }\nYou received ${ kiloNiceNum(toastView.amount/1000 )}TT`
        break;
      case 'thirdPartyRepMined' :
        result.header='Rep mined';
        result.text=`${ toastView.user }'s rep is now ${ niceNum(toastView.newRep/1000 )}`;
        break;
      case 'stakeReleased' :
        result.header='Rep stake released';
        result.text=`Your staked reputation was released and can now be reclaimed.`;
        break;
      case 'stakeLocked' :
        result.header='Rep stake locked';
        result.text=`Your stake has been locked in and can be reclaimed after you check in to the event.`;
        if (state.eventTime[toastView.poll])
          result.text += `Check-in open: ${sensibleDateTime([toastView.start, toastView.end]).join(' - ')}`
        break;
      default :
        return emptyResult
    }
    return result
  };
  return emptyResult
}

export const prioritiseThirdPartyEvents = (event, ownAddy)=>
  event.returnValues &&
    (event.to===ownAddy && (event.returnValues.amount ? -1 : -4)) + (event.returnValues.staker===ownAddy && -2) + (event.returnValues.amount && event.returnValues.by===ownAddy && -4)


const useTimeZone = true;

// warning, mutates!
export const sensibleDateTime = dates=> {
  if (!Array.isArray(dates))
    dates=[dates];

  // if every seconds of the passed date/s are zero
  const timeFn = dates.every(el=> !Number(new Date(el).toTimeString().slice(6,8)))
    ? d=> new Date(d).toTimeString().slice(0,5)
    : d=> new Date(d).toTimeString().slice(0,8)

  // now start comparing to today's date
  dates.push(new Date());

  // if every date is the same, including today's date
  const dateFn =
    dates.every(el=> new Date(dates[0]).toDateString() === new Date(el).toDateString())
    ? ()=> ''
      // if every year is the same, including today's year
    : dates.every(el=> new Date(dates[0]).toDateString().slice(11) === new Date(el).toDateString().slice(11))
      ? d=> Date(d).toDateString().slice(0,10)
      : d=> Date(d).toDateString().slice(0,15) ;

  const tzFn =
    useTimeZone
    ? ()=> Date(dates[0]).toTimeString().slice(9,15)
    : ()=> '' ;

  dates.pop();
  dates = dates.map(d=> [dateFn(d), timeFn(d), tzFn(d)].join(' '))

  return (dates.length>1) ? dates : dates[0]

}

export const time = d=> d.toTimeString().slice(0,8);
export const ms = d=> (d%1000).toFixed(3);

export const toUnixTime = x=>x;

export const unixifyTimes = resp=>
  Object.assign (resp,
    { start : resp.start ? toUnixTime(resp.start) : resp.start },
    { end : resp.end ? toUnixTime(resp.end) : resp.end },
  );

export const kiloNiceNum = num=>
  num >= 1000000
    ? niceNum(num/1000000)+'M '
    : num >= 1000
      ? niceNum(num/1000)+' k'
      : (num >= 1 || num==0)
        ? niceNum(num)
        : niceNum(num*1000)+' m' ;

export const niceNum = num=>
  (num || num===0)
    ? (Math.round(num*1000)/1000).toString()
    : '_' ;

export const niceTime = (time=498705720) =>
  time < Infinity
    ? new Date(time).toTimeString().slice(0,14)
    : 'Never' ;

export const checkInClosingIn = checkinCloses=>
  Math.max (checkinCloses-Date.now(), 0) ;
