import React, { useState, useEffect } from 'react';
import cN from 'classnames';

import AddPoll from './AddPoll';
import { fetchOnlinePoll } from '../helpers/doodleFetchers.js';
import '../App.scss';
import './pollsView.css';

const ChoosePollView = props=> {
  const { polls, addToChoices, livePolls, setPolls, setCurrentPoll } = props;

  const pollNamesSync=[];
  const [pollNames, setPollNames] = useState([]);

  useEffect(()=> {
    livePolls.forEach((pollUrl, idx)=> {
      fetchOnlinePoll(pollUrl)
        .then(poll=> poll.name)
        .then(pollName=> {
          pollNamesSync[idx] = pollName;
          setPollNames(pollNamesSync);
        });
    })

  }, []); // how to make a new poll show after adding it?

  return (
    <div className="polls-list__container">
      <div className="polls-list__known-polls__container">
        { livePolls.map((poll,idx)=> (            // NB you currently choose between live polls. with more functionality, there will be a point to choose between other polls too
          <div className={ cN( 'polls-list__known-polls', 'bg'+idx%2 ) }>
            <div className="">
              { pollNames[idx]|| 'event'+idx }
            </div>
            <div className="">
              { poll.url }
            </div>
          </div>
        ))}
      </div>
      <AddPoll
        addToChoices = { url=>{ if (polls.every(poll=>poll.url!==url)){ addToChoices(url); console.log('done');} else console.log('UHOH - duplicate url - did NOT addToChoices');} }
        polls = { polls }
        setPolls = { setPolls }
        setCurrentPoll = { setCurrentPoll }
      />
    </div>
)}


export default ChoosePollView;
