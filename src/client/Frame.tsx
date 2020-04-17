import React, { useRef, useLayoutEffect } from 'react';
import styled from 'styled-components';
import Loader from './Loader';
import { ScreenSize } from './constants';
import { editorWidth } from './ValuesEditor';

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
      <Device
        width={screenSize.width}
        height={screenSize.height}
        cornerRadius={screenSize.cornerRadius}
        bezelWidth={screenSize.bezelWidth}
      >
        <Overlay visible={reloading}>
          <Loader />
        </Overlay>

        <Screen ref={frameRef} src="about:blank" frameBorder="0" />

        {screenSize.headerHeight != null && (
          <Header
            height={screenSize.headerHeight}
            cornerRadius={screenSize.cornerRadius}
          />
        )}
      </Device>
    </Container>
  );
};

const Container = styled.div<{ editorVisible: boolean }>`
  position: fixed;
  left: ${({ editorVisible }) => (editorVisible ? editorWidth : 0)};
  height: 100%;
  width: ${({ editorVisible }) =>
    editorVisible ? `calc(100% - ${editorWidth}px)` : '100%'};
  background-color: #f4f4f4;
`;

const Device = styled.div<{
  height: number;
  width: number;
  cornerRadius?: number;
  bezelWidth?: number;
}>`
  position: absolute;
  height: ${({ height }) => (height != null ? `${height}px` : '100%')};
  width: ${({ width }) => (width != null ? `${width}px` : '100%')};
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #ffffff;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 0px 20px 0px;
  ${({ cornerRadius }) =>
    cornerRadius != null ? `border-radius: ${cornerRadius}px` : undefined};
  ${({ bezelWidth }) =>
    bezelWidth != null ? `border: ${bezelWidth}px solid #999999` : undefined};
`;

const Screen = styled.iframe`
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
`;

const Header = styled.div<{ height: number; cornerRadius: number }>`
  position: absolute;
  height: ${({ height }) => `${height}px`};
  width: 100%;
  top: 0;
  left: 0;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.7);
  ${({ cornerRadius }) => `border-top-left-radius: ${cornerRadius}px`};
  ${({ cornerRadius }) => `border-top-right-radius: ${cornerRadius}px`};
`;

const Overlay = styled.div<{ visible: boolean }>`
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  z-index: 1;
  position: fixed;
  height: 100%;
  background: rgba(0, 0, 0, 0.15);
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
  transition: opacity 150ms;
`;

export default Frame;
