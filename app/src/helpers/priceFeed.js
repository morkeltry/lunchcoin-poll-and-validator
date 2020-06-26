
// const feed='https://charts.coinlore.net/ajax/pupdate/?id=33913';   // Uses CORS :(
// const feed='';
const feed='https://graphs2.coinpaprika.com/currency/data/tt-thunder-token/1y/?quote=usd';
const fields = {
  'USD' : 'price',      // coinlore, coinpaprika
  'BTC' : 'p_btc_nf'    // coinlore
}

const getLast = arr=> arr[arr.length-1];

const log = x=> { console.log(x); return x }

const logSpace = x=> { console.log('\n\n\n\n\n\n\n\n________________________________________'); return x }

const process={
  'https://graphs2.coinpaprika.com/currency/data/tt-thunder-token/1y/?quote=usd' :
    currency=>
      resp=> resp.json()
        .then(getLast)
        .then(json=> json[fields[currency]])
        .then(getLast)
        .then(getLast)
}


export const getPrice = async (currency='USD')=> new Promise ((resolve,reject)=> {
  fetch(feed)
    .then( process[feed](currency) )
    .then( price=> {
      if (price)
        resolve(price)
      else
        reject('Received zero or no price');
    })
    .catch( err=>{
      console.log('\n\n\n\n\n\n\n\n________________________________________');
      console.log(err);
     })
})























// eslint is so annoying
