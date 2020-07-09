import React, { useState} from "react";
import { Route } from "react-router-dom";
import HttpsRedirect from 'react-https-redirect';
import "./App.scss";

import LunchcoinApp from "./components/LunchcoinApp";
import StakeApp from "./components/StakeApp";
import MineApp from "./components/MineApp";
import TestingApp from "./proxyBox_src/App";

const App = props => {
  const [ownAddy, setOwnAddy] = useState()

  return (
    <>
      <Route
        path="/"
        render={ ()=>
          <HttpsRedirect>
            <LunchcoinApp setOwnAddyParent={ setOwnAddy } />
          </HttpsRedirect>
         }
       />
      <Route
        path="/testing"
        render={ ()=>
          <HttpsRedirect>
            <LunchcoinApp setOwnAddyParent={ setOwnAddy } />
            <TestingApp ownAddy={ ownAddy } />
          </HttpsRedirect>
         }
       />
      <Route
        path="/stake"
        render={ ()=>
          <HttpsRedirect>
            <StakeApp setOwnAddyParent={ setOwnAddy } />
          </HttpsRedirect>
         }
       />
      <Route
        path="/mine"
        render={ ()=>
          <HttpsRedirect>
            <MineApp setOwnAddyParent={ setOwnAddy } />
          </HttpsRedirect>
        }
      />
    </>

)}

export default App;
