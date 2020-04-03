import React from 'react';

type Props = { children: string };

function SourceView(props: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        zIndex: 1
      }}
    >
      <textarea
        style={{
          position: 'absolute',
          border: 'none',
          backgroundColor: '#fafafa',
          width: '80vw',
          height: '80vh',
          padding: '1em',
          top: '10vh',
          bottom: '10vh',
          left: '10vw',
          right: '10vw',
          resize: 'none',
          fontFamily: '"Source Code Pro", Menlo, monospace',
          fontSize: '14px',
          whiteSpace: 'pre',
          boxShadow: '0 0 20px 0px rgba(0,0,0,0.1)'
        }}
        defaultValue={props.children}
        readOnly
        onClick={(event) => {
          event.currentTarget.focus();
          event.currentTarget.select();
        }}
      />
    </div>
  );
}

export default SourceView;
