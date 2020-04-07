import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ToggleSource from './ToggleSource';
import ValuesEditor from './ValuesEditor';
import Frame from './Frame';
import ButtonGroup from './ButtonGroup';
import storeValues from './utils/storeValues';
import fetchValues from './utils/fetchValues';
import Values from './Values';
import { Schema } from '../types';
import useDebouncedLayoutEffect from './utils/useDebouncedLayoutEffect';
import useWebSocket from './utils/useWebSocket';

declare global {
  interface Window {
    EMAIL: { name: string; schema: Schema };
  }
}

const { EMAIL } = window;

const Email: React.FC = () => {
  const [schema, setSchema] = useState(EMAIL.schema);

  const [editorVisible, setEditorVisible] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('editorVisible') || 'false');
    } catch (error) {
      return false;
    }
  });

  const [values, setValues] = useState(
    new Values(fetchValues(EMAIL.name, schema))
  );

  const [source, setSource] = useState<string>();

  const message = useWebSocket('ws://localhost:8081');

  useDebouncedLayoutEffect(
    () => {
      const controller = new AbortController();
      const { signal } = controller;

      fetch(`http://localhost:5000/emails/${EMAIL.name}`, {
        method: 'post',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: values.valueOf() }),
        signal
      })
        .then((response) => response.text())
        .then((source) => {
          setSource(source);
        });

      return () => {
        controller.abort();
      };
    },
    250,
    [values, message]
  );

  const sourceVisible = false;

  useEffect(() => {
    try {
      sessionStorage.setItem('editorVisible', JSON.stringify(editorVisible));
    } catch (error) {}

    if (document.body == null) {
      return;
    }

    if (editorVisible) {
      document.body.style.marginLeft = '300px';
    } else {
      document.body.style.marginLeft = '0';
    }
  }, [editorVisible]);

  useEffect(() => {
    storeValues(EMAIL.name, values);
  }, [values]);

  return (
    <>
      {/* <ButtonGroup>
        <ToggleSource
          sourceVisible={sourceVisible}
          onClick={() => {
            // this.setState({ sourceVisible: !sourceVisible });
          }}
        />
      </ButtonGroup> */}

      <Frame editorVisible={editorVisible} source={source} />

      <ValuesEditor
        schema={schema}
        values={values}
        visible={editorVisible}
        onToggle={() => {
          setEditorVisible((value) => !value);
        }}
        onChange={(values) => {
          setValues(values);
        }}
      />
    </>
  );
};

ReactDOM.render(<Email />, document.getElementById('container'));
