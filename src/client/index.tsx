import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import download from 'downloadjs';
import ValuesEditor, { editorWidth } from './ValuesEditor';
import Frame from './Frame';
import ButtonGroup from './ButtonGroup';
import storeValues from './utils/storeValues';
import deserializeValues from './utils/deserializeValues';
import { Schema } from '../types';
import useDebouncedLayoutEffect from './utils/useDebouncedLayoutEffect';
import useWebSocket from './utils/useWebSocket';
import Button from './Button';
import { SCREEN_SIZES } from './constants';

declare global {
  interface Window {
    EMAIL: { name: string; schema: Schema };
  }
}

const { EMAIL } = window;

const baseUrl = `${location.protocol}//${location.host}`;

const Email: React.FC = () => {
  const [schema, setSchema] = useState(EMAIL.schema);
  const [screenWidthIndex, setScreenWidthIndex] = useState(0);
  const [reloading, setReloading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [editorVisible, setEditorVisible] = useState<boolean>(() => {
    if (schema.length === 0) return false;

    try {
      return JSON.parse(sessionStorage.getItem('editorVisible') || 'false');
    } catch (error) {
      return false;
    }
  });

  const [values, setValues] = useState(
    deserializeValues(schema, localStorage.getItem(EMAIL.name))
  );

  const [source, setSource] = useState<string>();

  const message = useWebSocket('ws://localhost:8081', {
    enabled: location.hostname === 'localhost'
  });

  useEffect(() => {
    setReloading(true);
  }, [values, message]);

  useDebouncedLayoutEffect(
    () => {
      const controller = new AbortController();
      const { signal } = controller;

      fetch(`${baseUrl}/emails/${EMAIL.name}`, {
        method: 'post',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: values.valueOf() }),
        signal
      })
        .then((response) => response.text())
        .then((source) => {
          setSource(source);
        })
        .finally(() => {
          setReloading(false);
        });

      return () => {
        controller.abort();
      };
    },
    500,
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
      document.body.style.marginLeft = `${editorWidth}px`;
    } else {
      document.body.style.marginLeft = '0';
    }
  }, [editorVisible]);

  useEffect(() => {
    storeValues(EMAIL.name, values);
  }, [values]);

  const handleDownload = useCallback(() => {
    setDownloading(true);

    fetch(`${baseUrl}/emails/${EMAIL.name}/publish`, {
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
        <Select
          value={screenWidthIndex}
          onChange={(event) => {
            setScreenWidthIndex(event.currentTarget.selectedIndex);
          }}
        >
          {SCREEN_SIZES.map(({ label }, index) => (
            <option key={index} value={index}>
              {label}
            </option>
          ))}
        </Select>

        <Button title="Download" acting={downloading} onClick={handleDownload}>
          ⬇
        </Button>
      </ButtonGroup>

      <Frame
        editorVisible={editorVisible}
        screenSize={SCREEN_SIZES[screenWidthIndex]}
        source={source}
        reloading={reloading}
      />

      {schema.length > 0 && (
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
      )}
    </>
  );
};

const Select = styled.select`
  font-family: 'Source Code Pro', Menlo, monospace;
  opacity: 0.75;
  margin-right: 1.25em;
  border: 1px solid #bbbbbb;
  border-radius: 3px;
  background: #dddddd;
  padding: 0.25em 0.75em;
  transition: opacity 150ms;
  appearance: none;
  cursor: pointer;

  :hover,
  :focus {
    opacity: 1;
  }
`;

ReactDOM.render(<Email />, document.getElementById('container'));
