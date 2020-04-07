import React, { useRef, useState, useEffect } from 'react';
import Values from './Values';
import useDebouncedLayoutEffect from './utils/useDebouncedLayoutEffect';

interface Props {
  editorVisible: boolean;
  emailName: string;
  values: Values;
}

const useWebSocket = (url: string) => {
  const [message, setMessage] = useState<{ data: string }>();

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.addEventListener('message', (event) => {
      setMessage(event);
    });

    return () => {
      socket.close();
    };
  }, []);

  return message;
};

const Frame: React.FC<Props> = (props) => {
  const { emailName, editorVisible, values } = props;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const message = useWebSocket('ws://localhost:8081');

  useDebouncedLayoutEffect(
    () => {
      const controller = new AbortController();
      const { signal } = controller;

      fetch(`http://localhost:5000/emails/${emailName}`, {
        method: 'post',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: values.valueOf() }),
        signal
      })
        .then((response) => response.text())
        .then((html) => {
          if (frameRef.current != null) {
            frameRef.current.contentWindow.document.open();
            frameRef.current.contentWindow.document.write(html);
          }
        });

      return () => {
        controller.abort();
      };
    },
    250,
    [emailName, values, message]
  );

  return (
    <iframe
      ref={frameRef}
      src="about:blank"
      frameBorder="0"
      style={{
        position: 'fixed',
        left: editorVisible ? 300 : 0,
        height: '100%',
        width: editorVisible ? 'calc(100% - 300px)' : '100%'
      }}
    ></iframe>
  );
};

export default Frame;
