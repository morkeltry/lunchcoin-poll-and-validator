// let
// json = {
//   "id": "r9rb35fiibvs3aa5",
//   "latestChange": 1592864168372,
//   "initiated": 1592864168372,
//   "participantsCount": 0,
//   "inviteesCount": 0,
//   "type": "DATE",
//   "preferencesType": "YESNO",
//   "state": "OPEN",
//   "locale": "en_US",
//   "title": "Let's go to the beach!",
//   "location": {
//     "name": "The. Beach."
//   },
//   "initiator": {
//     "name": "Bobby Dobbs",
//     "notify": true
//   },
//   "options": [
//     {
//       "start": 1593345600000,
//       "id": "374f73dc-4923-459c-84e9-b4cf2143adce",
//       "allday": true,
//       "date": 1593345600000,
//       "available": true
//     }
//   ]
// }

const asUrl = url=>
  url.match(/https?:\/\//)
  ? url
  : `https://${url}` ;

const toDoodleApiUrl = pollUrl=>
  asUrl(
    pollUrl
      .replace('doodle.com/poll', 'doodle.com/api/v2.0/polls')
  );

const noCorsFetch = url=>
  fetch( `https://cors-anywhere.herokuapp.com/${url}`,
    {headers: { 'X-Requested-With': 'XMLHttpRequest' }}
  ) ;

export const fetchOnlinePoll = (pollUrl)=> new Promise ((resolve,reject)=> {
  noCorsFetch( toDoodleApiUrl( pollUrl ))
    .then(resp=> resp.json())
    .then(json=> json.title)
    .catch(err=>{
      console.log('err!', err);
      return reject(err)
    }) ;
})
