import React from 'react';
import download from 'downloadjs';
import styled from 'styled-components';

const Button = styled.button`
  transition: background-color 0.15s;
  position: relative;
  background-color: rgba(47, 224, 200, 0.4);
  color: rgba(22, 111, 99, 0.8);
  padding: 0;
  font-family: 'Source Code Pro', Menlo, monospace;
  border: none;
  cursor: pointer;
  padding: 0.5em 1em;
  outline: none;
  font-size: 14px;

  :hover {
    background-color: rgb(47, 224, 200, 0.7);
  }
`;

interface Props {
  values: object;
}

const ExportFile: React.FC<Props> = (props) => {
  const { values } = props;

  return (
    <Button
      onClick={() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        const fileName = `export-${year}-${month}-${day}.json`;

        download(JSON.stringify(values, null, 2), fileName, 'application/json');
      }}
    >
      ↓ Export
    </Button>
  );
};

export default ExportFile;
