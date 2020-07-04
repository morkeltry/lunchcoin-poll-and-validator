import React, { useState} from "react";
import HttpsRedirect from 'react-https-redirect';
import "./App.scss";

import LunchcoinApp from "./components/LunchcoinApp";
import TestingApp from "./proxyBox_src/App";

const App = props => {
  const [ownAddy, setOwnAddy] = useState()

  return (
    <HttpsRedirect>
      <LunchcoinApp setOwnAddyParent={ setOwnAddy } />
      <TestingApp ownAddy={ ownAddy } />
    </HttpsRedirect>
)}

export default App;
