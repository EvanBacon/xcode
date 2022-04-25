import * as React from "react";
import { TagInput } from "./components/tagInput";
import { JsonView } from "./components/jsonView";

import { parse, htmlText } from "./lib/parser/parser";
import { ContextVisitor } from "./lib/visitor/contextVisitor";

import "./styles.css";

import fixture from './fixture'

const defaultInputText = fixture["ios/ReactNativeProject.xcodeproj/project.pbxproj"]

function parseXcode(text: string) {
  const cst = parse(text);
  const visitor = new ContextVisitor();
  visitor.visit(cst);
  return visitor.context;
}

export default function App() {
  const [tagText, setTagText] = React.useState(defaultInputText);

  let context = {};
  let error = "";

  try {
    context = parseXcode(tagText)
  } catch (e) {
    // error = e.message;
  }

  return (
    <div className="App">
      {error && <p style={{ padding: "16px", color: "red" }}>{error}</p>}
      <div style={{ display: 'flex', flex: 1 }}>
        {false && <div style={{ display: 'flex', width: '50%', flex: 1, flexDirection: 'column' }}>
          <h2>Edit the tag field and see the result of the parsing</h2>
          <TagInput text={tagText} handler={setTagText} />
        </div>}
        <div style={{ display: 'flex', width: '50%', flex: 1, flexDirection: 'column' }}>
          <h2>JSON Output</h2>
          <JsonView json={context} />
        </div>
      </div>
      <Diagram />
    </div>
  );
}

function Diagram() {
  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
      <h2>Diagram(mar 😌)</h2>
      <iframe
        style={{
          width: "calc(100% - 16px)",
          height: "800px",
          padding: "10px",
          background: 'white',
          border: "none"
        }}
        src={"data:text/html;charset=utf-8," + encodeURI(htmlText)}
        title="grammar"
      />
    </div>
  )
}