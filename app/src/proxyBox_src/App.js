import React from "react";
import "./App.scss";
import AdminPanel from "./components/AdminPanel";

const App = props => {
  const { ownAddy } = props;
  return <AdminPanel ownAddy={ ownAddy } />
}

export default App;
