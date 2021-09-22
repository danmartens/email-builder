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
import { ListValueSchema } from '../server/utils/parseSchema';

interface Props<TValues extends {} = {}> {
  visible: boolean;
  schema: Schema;
  values: TValues;
  onToggle(): void;
  onChange(values: TValues): void;
}

export const editorWidth = 350;
export const editorActionsHeight = 48;

const ValuesEditor: React.FC<Props> = (props) => {
  const { values, visible, schema, onChange, onToggle } = props;

  return (
    <>
      <Editor visible={visible}>
        {schema.map((valueSchema) => (
          <FormGroup key={valueSchema.name}>
            <Label>{valueSchema.label}</Label>

            {valueSchema.type === 'list' ? (
              <>
                {(getIn(values, [valueSchema.name], []) as object[]).map(
                  (_, index) => (
                    <ListItem key={index}>
                      {valueSchema.schema.map((nestedValueSchema) => (
                        <FormGroup key={nestedValueSchema.name}>
                          <Label>{nestedValueSchema.label}</Label>

                          <ValueEditor
                            schema={nestedValueSchema}
                            value={getIn(
                              values,
                              [valueSchema.name, index, nestedValueSchema.name],
                              ''
                            )}
                            onChange={(value) => {
                              onChange(
                                setIn(
                                  values,
                                  [
                                    valueSchema.name,
                                    index,
                                    nestedValueSchema.name
                                  ],
                                  value
                                )
                              );
                            }}
                          />
                        </FormGroup>
                      ))}

                      <Button
                        onClick={() => {
                          onChange(removeIn(values, [valueSchema.name, index]));
                        }}
                      >
                        × Remove
                      </Button>
                    </ListItem>
                  )
                )}

                <Button
                  onClick={() => {
                    onChange(
                      updateIn(values, [valueSchema.name], (value) => {
                        return [
                          ...value,
                          mergeListItemDefaultValues(valueSchema.schema)
                        ];
                      })
                    );
                  }}
                >
                  + Add Item
                </Button>
              </>
            ) : (
              <ValueEditor
                schema={valueSchema}
                value={getIn(values, [valueSchema.name], '')}
                onChange={(value) => {
                  onChange(setIn(values, [valueSchema.name], value));
                }}
              />
            )}
          </FormGroup>
        ))}

        <EditorActions visible={visible}>
          <ExportFile values={values} />
          <ImportFile values={values} onImport={onChange} />
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
};

const ValueEditor: React.FC<{
  schema: ListValueSchema;
  value: string | { src: string; srcset: string };
  onChange(value: string | { src: string; srcset: string }): void;
}> = (props) => {
  const { schema, value, onChange } = props;

  return (
    <>
      {schema.type === 'image' && typeof value !== 'string' && (
        <ImageUploader
          value={value}
          maxWidth={schema.dimensions?.maxWidth}
          maxHeight={schema.dimensions?.maxHeight}
          onUpload={(result) => {
            onChange(result);
          }}
        />
      )}

      {schema.type === 'string' && typeof value === 'string' && (
        <Input
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.currentTarget.value);
          }}
        />
      )}

      {schema.type === 'text' && typeof value === 'string' && (
        <TextArea
          rows={3}
          value={value}
          onChange={(event) => {
            onChange(event.currentTarget.value);
          }}
        />
      )}
    </>
  );
};

const Editor = styled.div<{ visible: boolean }>`
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

const FormGroup = styled.div`
  margin-bottom: 1.5em;
  flex: 1;
  display: flex;
  flex-direction: column;
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

const EditorActions = styled.div<{ visible: boolean }>`
  box-sizing: border-box;
  position: fixed;
  bottom: 0;
  left: ${({ visible }) => (visible ? 0 : `-${editorWidth}px`)};
  width: ${editorWidth}px;
  height: ${editorActionsHeight}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1em;
  background-color: rgba(230, 230, 230, 0.98);
`;

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

export default ValuesEditor;
