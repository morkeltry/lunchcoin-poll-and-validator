
export const fetchOnlinePoll = (pollUrl)=> new Promise ((resolve,reject)=> {
  resolve ({
    name : `Let's go to the beach!!`
  });
  // fetch(pollUrl)
  //   .then (resp=> resp.xml)
  //   .then (pull out name, etc.)
  //   .then (setPollName) ;
})
