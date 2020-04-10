import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import download from 'downloadjs';
import ValuesEditor from './ValuesEditor';
import Frame from './Frame';
import ButtonGroup from './ButtonGroup';
import storeValues from './utils/storeValues';
import fetchValues from './utils/fetchValues';
import Values from './Values';
import { Schema } from '../types';
import useDebouncedLayoutEffect from './utils/useDebouncedLayoutEffect';
import useWebSocket from './utils/useWebSocket';
import Button from './Button';

declare global {
  interface Window {
    EMAIL: { name: string; schema: Schema };
  }
}

const { EMAIL } = window;

const Email: React.FC = () => {
  const [schema, setSchema] = useState(EMAIL.schema);
  const [downloading, setDownloading] = useState(false);

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

  const handleDownload = useCallback(() => {
    setDownloading(true);

    fetch(`http://localhost:5000/emails/${EMAIL.name}/publish`, {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: values.valueOf() })
    })
      .then((response) => response.text())
      .then((source) => {
        download(source, `${EMAIL.name}.html`, 'text/html');
      })
      .finally(() => {
        setDownloading(false);
      });
  }, [values]);

  return (
    <>
      <ButtonGroup>
        <Button
          title="Download"
          disabled={downloading}
          onClick={handleDownload}
        >
          ⬇
        </Button>
      </ButtonGroup>

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
