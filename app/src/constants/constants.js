
export const expectedProductionNetwork = 108;

export const networkName = {
  108  : 'Thundercore mainnet',
}

// Default poll - used for demo in muliple components, to populate both forms and state
export const defaultPoll = 'doodle.com/poll/r9rb35fiibvs3aa5';

// Used in StakeApp demo component - prevents accidentally staking zero rep
// (though this should normally be allowed, in case venue contributions are made)
export const alwaysStakeSomeRep = 1;

export var fallbackToLocalGrrWebpack = false;
