import React from 'react';
import styled from 'styled-components';
import AutosizeTextArea from 'react-textarea-autosize';
import { getIn, setIn, updateIn, removeIn } from 'immutable';
import ImageUploader from './ImageUploader';
import ExportFile from './ExportFile';
import ImportFile from './ImportFile';
import EditorToggle from './EditorToggle';
import { Schema } from '../types';
import mergeListItemDefaultValues from './utils/mergeListItemDefaultValues';

interface Props<TValues extends {} = {}> {
  visible: boolean;
  schema: Schema;
  values: TValues;
  onToggle(): void;
  onChange(values: TValues): void;
}

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
                value={getIn(values, [valueSchema.name], '')}
                maxWidth={valueSchema.dimensions?.maxWidth}
                maxHeight={valueSchema.dimensions?.maxHeight}
                onUpload={(url) => {
                  onChange(setIn(values, [valueSchema.name], url));
                }}
              />
            )}

            {valueSchema.type === 'string' && (
              <Input
                type="text"
                value={getIn(values, [valueSchema.name], '')}
                onChange={(event) => {
                  onChange(
                    setIn(values, [valueSchema.name], event.currentTarget.value)
                  );
                }}
              />
            )}

            {valueSchema.type === 'text' && (
              <TextArea
                rows={3}
                value={getIn(values, [valueSchema.name], '')}
                onChange={(event) => {
                  onChange(
                    setIn(values, [valueSchema.name], event.currentTarget.value)
                  );
                }}
              />
            )}

            {valueSchema.type === 'list' && (
              <>
                {getIn(values, [valueSchema.name], []).map((_, index) => (
                  <ListItem key={index}>
                    {valueSchema.schema.map((nestedValueSchema) => (
                      <div
                        key={nestedValueSchema.name}
                        style={{
                          marginBottom: '1.5em',
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <Label>{nestedValueSchema.label}</Label>

                        {nestedValueSchema.type === 'image' && (
                          <ImageUploader
                            value={getIn(
                              values,
                              [valueSchema.name, index, nestedValueSchema.name],
                              ''
                            )}
                            maxWidth={nestedValueSchema.dimensions?.maxWidth}
                            maxHeight={nestedValueSchema.dimensions?.maxHeight}
                            onUpload={(url) => {
                              onChange(
                                setIn(
                                  values,
                                  [
                                    valueSchema.name,
                                    index,
                                    nestedValueSchema.name
                                  ],
                                  url
                                )
                              );
                            }}
                          />
                        )}

                        {nestedValueSchema.type === 'string' && (
                          <Input
                            type="text"
                            value={getIn(
                              values,
                              [valueSchema.name, index, nestedValueSchema.name],
                              ''
                            )}
                            onChange={(event) => {
                              onChange(
                                setIn(
                                  values,
                                  [
                                    valueSchema.name,
                                    index,
                                    nestedValueSchema.name
                                  ],

                                  event.currentTarget.value
                                )
                              );
                            }}
                          />
                        )}

                        {nestedValueSchema.type === 'text' && (
                          <TextArea
                            rows={3}
                            value={getIn(
                              values,
                              [valueSchema.name, index, nestedValueSchema.name],
                              ''
                            )}
                            onChange={(event) => {
                              onChange(
                                setIn(
                                  values,
                                  [
                                    valueSchema.name,
                                    index,
                                    nestedValueSchema.name
                                  ],

                                  event.currentTarget.value
                                )
                              );
                            }}
                          />
                        )}
                      </div>
                    ))}

                    <Button
                      onClick={() => {
                        onChange(removeIn(values, [valueSchema.name, index]));
                      }}
                    >
                      Remove
                    </Button>
                  </ListItem>
                ))}

                <Button
                  onClick={() => {
                    onChange(
                      updateIn(values, [valueSchema.name], (value) => {
                        console.log({ value });
                        return [
                          ...value,
                          mergeListItemDefaultValues(valueSchema.schema)
                        ];
                      })
                    );
                  }}
                >
                  Append Item
                </Button>
              </>
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

const ListItem = styled.fieldset`
  box-sizing: border-box;
  display: flex;
  border: none;
  background: #eeeeee;
  padding: 0.75em 1em;
  margin-bottom: 1.5em;
`;

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

ValuesEditor.displayName = 'ValuesEditor';

export default ValuesEditor;
