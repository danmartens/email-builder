import React, { useRef, useLayoutEffect } from 'react';
import styled from 'styled-components';
import Loader from './Loader';
import { ScreenSize } from './constants';

interface Props {
  editorVisible: boolean;
  screenSize: ScreenSize;
  source: string | undefined;
  reloading: boolean;
}

const Frame: React.FC<Props> = (props) => {
  const { editorVisible, screenSize, source, reloading } = props;
  const frameRef = useRef<HTMLIFrameElement>(null);

  useLayoutEffect(() => {
    if (frameRef.current != null && source != null) {
      frameRef.current.contentWindow.document.open();
      frameRef.current.contentWindow.document.write(source);
    }
  }, [source]);

  return (
    <Container editorVisible={editorVisible}>
      <div
        style={{
          position: 'absolute',
          height: screenSize.height != null ? `${screenSize.height}px` : '100%',
          width: screenSize.width != null ? `${screenSize.width}px` : '100%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ffffff',
          boxShadow: 'rgba(0, 0, 0, 0.25) 0px 0px 20px 0px',
          borderRadius: screenSize.radius,
          border: `${screenSize.bezel}px solid #999999`,
          transition: 'width 750ms, border-radius 750ms, border 750ms'
        }}
      >
        <Overlay visible={reloading}>
          <Loader />
        </Overlay>

        <iframe
          ref={frameRef}
          src="about:blank"
          frameBorder="0"
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            top: 0,
            left: 0
          }}
        ></iframe>

        <Header height={64} borderRadius={screenSize.radius} />
      </div>
    </Container>
  );
};

const Container = styled.div<{ editorVisible: boolean }>`
  position: fixed;
  left: ${({ editorVisible }) => (editorVisible ? 300 : 0)};
  height: 100%;
  width: ${({ editorVisible }) =>
    editorVisible ? 'calc(100% - 300px)' : '100%'};
  background-color: #f4f4f4;
`;

const Header = styled.div<{ height: number; borderRadius: number }>`
  position: absolute;
  height: ${({ height }) => `${height}px`};
  width: 100%;
  top: 0;
  left: 0;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.7);
  border-top-left-radius: ${({ borderRadius }) => `${borderRadius}px`};
  border-top-right-radius: ${({ borderRadius }) => `${borderRadius}px`};
`;

const Overlay = styled.div<{ visible: boolean }>`
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  z-index: 1;
  position: fixed;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
  transition: opacity 150ms;
`;

export default Frame;
