import React, { useState, useEffect } from "react";
import  { useGlobal } from "reactn";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

// import { callTransaction, sendTransaction } from "../../Web3/adminPanel";
import { callTransaction, sendTransaction, currentOwnAddy } from "../../../Web3/accessChain";

import { globalDefaults, byFuncDefaults, clearAfterSubmit } from './formConfig'
import "./functionForm.css";
import "./segregatedPanel.scss";

const timeString = date => `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

const FunctionForm = props => {
  const { ownAddy } = props;

  const [disabled, setDisabled] = useState(false);
  const [args, setArgs] = useState({});
  const [shouldRefresh,setShouldRefresh] = useState({});
  const [response, setBareResponse] = useState(["",""]);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  useEffect(() => {

    setArgs(props.funcArgs);
  }, [props.funcArgs, disabled]);

  const setResponse = resp=> {
    console.log(`${timeString(new Date())}Setting: ${typeof resp}:`,resp);
    setBareResponse([timeString(new Date()),resp]);
  }

  const callContract = functionName => {
    return new Promise((resolve, reject) => {
      if (!props.functionHasArguments) {
        callTransaction(functionName, {})
          .then(response => {

            setResponse( (typeof response === "object") ? response : response.toString());
            setError("");
            resolve();
          })
          .catch(err => {
            setError(err.toString());
            setResponse("");
            resolve();
          });
      } else {
        let objToBePassed = {};
        Object.keys(args).forEach(ele => {
          objToBePassed[ele.split(" ")[0]] = args[ele];
        });
        console.log('Input:', objToBePassed);

        callTransaction(functionName, objToBePassed)
          .then(response => {

            setResponse( (typeof response === "object") ? response : response.toString());
            setError("");
            resolve();
          })
          .catch(err => {
            setError(err.toString());
            setResponse("");
            resolve();
          });
      }
    });
  };

  const sendContract = functionName => {
    return new Promise((resolve, reject) => {
      if (!props.functionHasArguments) {
        sendTransaction(functionName, {})
          .then(response => {
            setLink(response.transactionHash);
            setError("");
            resolve();
          })
          .catch(err => {
            setLink("");
            setError(err.toString());
            resolve(err);
          });
      } else {
        let objToBePassed = {};
        Object.keys(args).forEach(ele => {
          objToBePassed[ele.split(" ")[0]] = args[ele];
        });

        sendTransaction(functionName, objToBePassed)
          .then(response => {
            setLink(response.transactionHash);
            setError("");
            resolve();
          })
          .catch(err => {
            setLink("");
            console.log(err);
            if (err.toString() === "TypeError: param.map is not a function")
              setError(err.toString() + "\nhint - make sure array input is JSON.parse-able!")
            else
              setError(err.toString());
            resolve(err);
          });
      }
    });
  };

  const wait = async ms=> new Promise( resolve=> {
    setTimeout(()=>{ resolve() }, ms)
  })

  const defaultVal = (func, arg) => {
    arg = arg.split(' ')[0];
    const preFill= (byFuncDefaults[func] && byFuncDefaults[func][arg]) || globalDefaults[arg];

    return preFill==='OWN_ADDRESS'
      ? ownAddy
      : preFill
  }

  // NB args in state weirdle is an array with non-iterable members. But only the iterable ones show up in devTools.
  const onFieldChange = (e, argumentName) => {
    let tempState = args;
    if (e.target.value === "")
      delete tempState[argumentName];
    else tempState[argumentName] = e.target.value;

  };

  const handleSubmit = async (e, funcName) => {
    e.preventDefault();
    e.stopPropagation();

    if (props.panelName === "read") {
      setDisabled(true);

      await callContract(funcName);
      setDisabled(false);
    } else {
      sendContract(funcName);
      setDisabled(false);
    }
    doSelectiveFieldClear(e, funcName);
  };

  const doSelectiveFieldClear = (e, funcName)=> {
    let refreshObj={};
    if (clearAfterSubmit[funcName]) {
      let tempState = args;
      clearAfterSubmit[funcName].forEach( arg=> {
        delete tempState[ tempState.find(fullArgName=> fullArgName.startsWith(arg)) ];
      })
      setArgs(tempState);
      refreshObj[funcName] = Math.random();
      setShouldRefresh( refreshObj );
    }
  };

  return (
    <Col md={{ span: 12 }}>
      <Form
        onSubmit={e => {
          handleSubmit(e, props.funcName);
        }}
      >
        <Form.Group controlId={props.funcName}>
          <h3 className={"function-name"}>
            {" "}
            Function name: <span> {props.funcName} </span>
          </h3>
          {props.funcArgs.map((arg, argsKey) => {
            return (
              <Form.Control
                id={`${props.funcName} ${arg}`}
                key={ argsKey + (shouldRefresh[props.funcName] || 0) }
                type={"text"}
                placeholder={"argument(type):  " + arg}
                defaultValue={ defaultVal(props.funcName,arg, props.ownAddy) }
                required
                className={"function-arg"}
                onChange={e => {
                  onFieldChange(e, arg);
                }}
                onClick={e => {
                  onFieldChange(e, arg);
                }}
              />
            );
          })}
          <Row>
            <Col md={{ span: 9, offset: 0 }}>
              {response[0].length !== 0 ? (
                <div className={"response"}>
                  RESPONSE :&nbsp;&nbsp;&nbsp;&nbsp;{response[0]} - {typeof response[1] === 'object' ? JSON.stringify(Object.values(response[1])) : response }
                </div>
              ) : null}
              {error.length !== 0 ? (
                <div className={"form-error"}>{error}</div>
              ) : null}
              {link.length !== 0 ? (
                <div className={"link"}>Hash {link}</div>
              ) : null}
            </Col>

            <Col md={{ span: 2, offset: 1 }}>
              <Button
                disabled={disabled}
                className={"function-call-button"}
                type={"submit"}
              >
                {props.panelName === "read" ? "Call" : "Send"}
              </Button>
            </Col>
          </Row>
        </Form.Group>
      </Form>
    </Col>
  );
};

export default FunctionForm;
