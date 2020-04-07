import React from 'react';
import styled from 'styled-components';
import AutosizeTextArea from 'react-textarea-autosize';

import ImageUploader from './ImageUploader';
import ExportFile from './ExportFile';
import ImportFile from './ImportFile';
import EditorToggle from './EditorToggle';
import Values from './Values';
import { Schema } from '../types';

type Props = {
  visible: boolean;
  schema: Schema;
  values: Values;
  onToggle(): void;
  onChange(values: Values): void;
};

const editorWidth = 300;
const editorActionsHeight = 48;

const Editor = styled.div`
  position: fixed;
  box-sizing: border-box;
  left: ${(props) => (props.visible ? 0 : `-${editorWidth}px`)};
  top: 0;
  bottom: ${editorActionsHeight}px;
  width: ${editorWidth}px;
  padding: 1em 1em ${editorActionsHeight}px 1em;
  background-color: rgba(250, 250, 250, 0.9);
  overflow-y: scroll;
  border-right: 1px solid rgb(235, 235, 235);
`;

const Label = styled.label`
  display: block;
  font-family: Monaco;
  font-size: 14px;
  margin-bottom: 0.5em;
`;

const Input = styled.input`
  font-size: 16px;
  padding: 0.5em;
`;

const TextArea = styled(AutosizeTextArea)`
  font-size: 14px;
  padding: 0.5em;
  resize: none;
`;

const EditorActions = styled.div`
  box-sizing: border-box;
  position: fixed;
  bottom: 0;
  left: ${(props) => (props.visible ? 0 : `-${editorWidth}px`)};
  width: ${editorWidth}px;
  height: ${editorActionsHeight}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1em;
  background-color: rgba(230, 230, 230, 0.98);
`;

export function ValuesEditor(props: Props) {
  const { values, visible, schema, onChange, onToggle } = props;

  return (
    <>
      <Editor visible={visible}>
        {schema.map((valueSchema) => (
          <div
            key={valueSchema.name}
            style={{
              marginBottom: '1.5em',
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Label>{valueSchema.label}</Label>

            {valueSchema.type === 'image' && (
              <ImageUploader
                value={values.get(valueSchema.name)}
                maxWidth={valueSchema.dimensions?.maxWidth}
                maxHeight={valueSchema.dimensions?.maxHeight}
                onUpload={(url) => {
                  onChange(values.set(valueSchema.name, url));
                }}
              />
            )}

            {valueSchema.type === 'string' && (
              <Input
                type="text"
                value={values.get(valueSchema.name)}
                onChange={(event) => {
                  onChange(
                    values.set(valueSchema.name, event.currentTarget.value)
                  );
                }}
              />
            )}

            {valueSchema.type === 'text' && (
              <TextArea
                rows={3}
                value={values.get(valueSchema.name)}
                onChange={(event) => {
                  onChange(
                    values.set(valueSchema.name, event.currentTarget.value)
                  );
                }}
              />
            )}
          </div>
        ))}

        <EditorActions visible={visible}>
          <ExportFile />
          <ImportFile />
        </EditorActions>
      </Editor>

      <EditorToggle
        editorWidth={editorWidth}
        visible={visible}
        onClick={onToggle}
      >
        {props.visible ? '❮' : '❯'}
      </EditorToggle>
    </>
  );
}

ValuesEditor.displayName = 'ValuesEditor';

export default ValuesEditor;
