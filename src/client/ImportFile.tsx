import React from 'react';
import styled from 'styled-components';

interface Props<TValues extends {} = {}> {
  values: TValues;
  onImport(values: TValues): void;
}

const ImportFile: React.FC<Props> = (props) => {
  const { values, onImport } = props;

  return (
    <Wrapper>
      ↑ Import
      <Input
        type="file"
        accept=".json"
        onChange={(event) => {
          const file = event.currentTarget.files![0];
          const reader = new FileReader();

          reader.addEventListener(
            'load',
            () => {
              const data = JSON.parse(reader.result!.toString());

              const nextValues = {
                ...values,
                ...data
              };

              onImport(nextValues);
            },
            false
          );

          reader.readAsText(file);
        }}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
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

const Input = styled.input`
  opacity: 0;
  appearance: none;
  position: absolute;
  bottom: 0;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  cursor: pointer;
`;

export default ImportFile;
