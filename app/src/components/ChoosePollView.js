import React, { useState, useEffect } from 'react';
import cN from 'classnames';

import AddPoll from './AddPoll';
import { fetchOnlinePoll } from '../helpers/doodleFetchers.js';
import '../App.scss';
import './pollsView.css';

const ChoosePollView = props=> {
  const { polls, addPoll, livePolls, setPolls, setCurrentPoll } = props;

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
    <div classname="polls-list__container">
      { livePolls.map((poll,idx)=> (            // NB you currently choose between live polls. with more functionality, there will be a point to choose between other polls too
        <div className={ cN( 'polls-list__known-polls', 'bg'+idx%2 ) }>
          <div className="polls-list__known-polls">
            { poll }
          </div>
          <div className="">
            { pollNames[idx] || 'event'+idx }
          </div>
        </div>
      ))}
      <AddPoll
        add = { url=>{ if (polls.every(poll=>poll.url!==url)){ addPoll(url); console.log('done');} else console.log('UHOOOOOOOOOOOOOOOOOOHHHHHH');} }
        polls = { polls }
        setPolls = { setPolls }
        setCurrentPoll = { setCurrentPoll }
      />
    </div>
)}


export default ChoosePollView;
