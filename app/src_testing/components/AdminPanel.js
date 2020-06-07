import React, {useEffect, useState} from "react";
// import {connectToWeb3, getImplementationFunctions, getImplementationEvents, setEventWatchers, switchTo} from "../Web3/adminPanel";
import {connectToWeb3, getImplementationFunctions, getImplementationEvents, switchTo} from "../Web3/adminPanel";
import SegregatedPanel from "./segregatedPanel/SegregatedPanel";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Col from "react-bootstrap/Col";
import Loading from "./Loading";
import {Form} from "react-bootstrap";
import "../App.scss";


const readFormArray = [];
const writeFormArray = [];
const eventsObj = {};
const readPanelViewBoolean = true;
const writePanelViewBoolean = true;

const AdminPanel = props => {
  const [readForm, setReadForm] = useState(readFormArray);
  const [writeForm, setWriteForm] = useState(writeFormArray);
  const [events, setEvents] = useState(eventsObj);
  const [readPanelView, setReadPanelView] = useState(readPanelViewBoolean);
  const [writePanelView, setWritePanelView] = useState(writePanelViewBoolean);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [currentContractAddress, setCurrentContractAddress] = useState('')
  const [alternateContractAddress, setAlternateContractAddress] = useState('')
  const [nextAddresses, setNextAddresses] = useState([])


  useEffect(() => {
    let tempRead = [];
    let tempWrite = [];
    setLoadingStatus(true);
    connectToWeb3().then(addressObj => {
      console.log(addressObj)

      setCurrentContractAddress(addressObj.IMPLEMENTATION_ADDRESS)
      setAlternateContractAddress(addressObj.unImplementedAddress)
      setNextAddresses([addressObj.PollAddress, addressObj.ValidatorAddress])
      return true
    }).then(() => {
      getImplementationEvents({ setWatchers:true })
        .then (foundEvents=> {
          console.log(foundEvents);
          foundEvents.forEach( event=> {
            eventsObj[event.eventName]={signature : event.signature};
          });
        setEvents(eventsObj);
      });
      return getImplementationFunctions()

    }).then(implementationFunctions => {
      console.log(implementationFunctions);
      implementationFunctions.forEach(func => {
        if (func.mutates) {
          tempWrite.push(func);
        } else {
          tempRead.push(func);
        }

      });
      setReadForm(tempRead);
      setWriteForm(tempWrite);
      setLoadingStatus(false)
    })
  }, []);


  const readClick = () => {
    setReadPanelView(true);
    setWritePanelView(false);
  };

  const writeClick = () => {
    setReadPanelView(false);
    setWritePanelView(true);
  };
  const switchContract = (e) => {
    console.log(e.target.value)
    switchTo(e.target.value).then(()=>{
      window.location.reload()
    })

  }

  return (
      <Container fluid={"true"}>
        <Navbar expand="lg">

          <button
              className="navbar-toggler"
              type="button"
              data-toggle="collapse"
              data-target="#navbarText"
              aria-controls="navbarText"
              aria-expanded="false"
              aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"> </span>
          </button>

            <Nav className={'justify-content-left'}>
              <Nav.Link>
                <Form.Label>
                  Switch Contracts
                </Form.Label>
                <Form.Control as={'select'} onChange={switchContract}>
                  <option value={currentContractAddress}>{currentContractAddress}</option>
                  <option value={alternateContractAddress}>{alternateContractAddress} </option>
                  <option value={nextAddresses[0]}>{nextAddresses[0]} </option>
                  <option value={nextAddresses[1]}>{nextAddresses[1]} </option>
                </Form.Control>
              </Nav.Link>

            </Nav>
            <Nav className={"ml-auto"}>
              <Nav.Link>
                <Button
                  onClick={readClick}
                  className={ readPanelView? "pressed" : "" }
                >Read functions</Button>
              </Nav.Link>
              <Nav.Link>
                <Button
                  onClick={writeClick}
                  className={ writePanelView? "pressed" : "" }
                >Write functions</Button>
              </Nav.Link>
            </Nav>
        </Navbar>

        <Row>
          <Col md={12}>
            <h1> Admin Panel</h1>
          </Col>
        </Row>

        {loadingStatus ? (
            <Loading heading={"Loading Contract..."}/>
        ) : (
            <Row>
              { writePanelView && (
                  <SegregatedPanel
                      panelName={"write"}
                      form={writeForm}
                      view={writePanelView}
                      contractType={ (currentContractAddress===nextAddresses[0]) && "POLL" }
                  />
              )}
              { readPanelView && (
                  <SegregatedPanel
                      panelName={"read"}
                      form={readForm}
                      view={readPanelView}
                      contractType={ (currentContractAddress===nextAddresses[1]) && "VALIDATOR" }
                  />
              )}
            </Row>
        )}
      </Container>
  );
};


export default AdminPanel;
