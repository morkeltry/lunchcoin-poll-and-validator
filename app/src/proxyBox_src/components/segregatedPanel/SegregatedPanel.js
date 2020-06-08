import React from "react";

import Col from "react-bootstrap/Col";
import "../../App.scss";
import "./segregatedPanel.scss";
import "../../App.scss";
import "./segregatedPanel.scss";
import Row from "react-bootstrap/Row";

import FunctionForm from "./FunctionForm";
import { doNotShowFuncs } from './formConfig'

const SegregatedPanel = props => {
  const getFunctionDetails = functionName => {
    return props.form.find(element => {
      return element.funcName === functionName;
    });
  };

  const functionHasArguments = functionName => {
    let functionDetails = getFunctionDetails(functionName);
    return functionDetails.args.length !== 0;
  };

  const blacklist = formFunction=>
    !doNotShowFuncs[formFunction.funcName] ;

  return (
    <Col md={{ span: 8, offset: 2 }} className={"contract-form"}>
      <Row className={"form-heading"}>
        <Col md={12}>
          <h1>{props.panelName} functions</h1>
          <p>
            "{props.panelName}" type functions available on
            your { props.contractType || "" } contract
          </p>
        </Col>
      </Row>

      {props.form
        .filter(blacklist)
        .map((formFunction, key) => {
        return (
          <Row key={key + formFunction.funcName} className={"function-form"}>
              <FunctionForm
                funcName={formFunction.funcName}
                funcArgs={formFunction.args}
                functionHasArguments={functionHasArguments(
                  formFunction.funcName
                )}
                panelName={props.panelName}
              />
          </Row>
        );
      })}
    </Col>
  );
};
export default SegregatedPanel;
