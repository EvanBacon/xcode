import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

interface TagInputProps {
  text: string;
  handler: React.Dispatch<React.SetStateAction<string>>;
}

export const TagInput: React.FC<TagInputProps> = ({ text, handler }) => {
  const handleChange = (event: any) => {
    handler(event.target.value);
  };

  return (
    <Box
      component="form"
      sx={{
        "& > :not(style)": { m: 1, width: "calc(100% - 16px)" }
      }}
      noValidate
      autoComplete="off"
    >
      <TextField
        id="outlined-basic"
        label="Tag"
        variant="outlined"
        multiline
        value={text}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
        placeholder='{tag:myTag var1="value1" var2="value2"}'
      />
    </Box>
  );
};
