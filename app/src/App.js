import React, { useState} from "react";
import "./App.scss";
import LunchcoinApp from "./components/LunchcoinApp";
import TestingApp from "./proxyBox_src/App";

const App = props => {

const [ownAddy, setOwnAddy] = useState()

  return <>
    <LunchcoinApp setOwnAddyParent={ setOwnAddy } />
    <TestingApp ownAddy={ ownAddy } />
  </>
}

export default App;
