import React, { useRef, useLayoutEffect } from 'react';

interface Props {
  editorVisible: boolean;
  source: string;
}

const Frame: React.FC<Props> = (props) => {
  const { editorVisible, source } = props;
  const frameRef = useRef<HTMLIFrameElement>(null);

  useLayoutEffect(() => {
    if (frameRef.current != null) {
      frameRef.current.contentWindow.document.open();
      frameRef.current.contentWindow.document.write(source);
    }
  }, [source]);

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
