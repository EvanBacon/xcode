// import the react-json-view component
import * as React from "react";
import Box from "@mui/material/Box";
import ReactJson from "react-json-view";

interface JsonViewProps {
  json: object;
}


const FooBar: any = ReactJson;

export const JsonView: React.FC<JsonViewProps> = ({ json }) => {
  return (
    <Box
      component="form"
      sx={{
        "& > :not(style)": {
          m: 1,
          border: "1px solid grey",
          borderRadius: "4px",
          padding: "10px"
        }
      }}
      noValidate
      autoComplete="off"
    >

      <FooBar name={null} src={json} collapsed={true} />
    </Box>
  );
};

// use the component in your app!
