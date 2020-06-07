import React from 'react';

const LiveEvent = props => {
const { poll } = props;

return(
    <div className={'poll'}>
        <h1>{props.heading}</h1>
        <div>
            Deets : {poll}
        </div>
        <div>
            Deets : {poll}
        </div>
        <div>
            Deets : {poll}
        </div>
    </div>
)
}

export default LiveEvent;
