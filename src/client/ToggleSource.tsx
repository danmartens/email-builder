import React from 'react';

import Button from './Button';

type Props = { sourceVisible: boolean; onClick: () => void };

function ToggleSource(props: Props) {
  return (
    <Button fontSize={props.sourceVisible ? 20 : 12} onClick={props.onClick}>
      {props.sourceVisible ? '×' : '</>'}
    </Button>
  );
}

export default ToggleSource;
