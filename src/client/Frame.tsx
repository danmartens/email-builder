import React, { useRef, useLayoutEffect } from 'react';
import styled from 'styled-components';
import Loader from './Loader';

interface Props {
  editorVisible: boolean;
  source: string | undefined;
  reloading: boolean;
}

const Frame: React.FC<Props> = (props) => {
  const { editorVisible, source, reloading } = props;
  const frameRef = useRef<HTMLIFrameElement>(null);

  useLayoutEffect(() => {
    if (frameRef.current != null && source != null) {
      frameRef.current.contentWindow.document.open();
      frameRef.current.contentWindow.document.write(source);
    }
  }, [source]);

  return (
    <>
      {reloading && (
        <Overlay editorVisible={editorVisible}>
          <Loader />
        </Overlay>
      )}

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
    </>
  );
};

const Overlay = styled.div`
  z-index: 1;
  position: fixed;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  left: ${({ editorVisible }) => (editorVisible ? '300px' : '0')};
  width: ${({ editorVisible }) =>
    editorVisible ? 'calc(100% - 300px)' : '100%'};
`;

export default Frame;
