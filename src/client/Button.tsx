import React from 'react';
import styled from 'styled-components';

import Loader from './Loader';

const size = 36;

type HTMLButtonElementProps = Omit<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
  'ref'
>;

interface Props extends HTMLButtonElementProps {
  acting?: boolean;
}

const Button: React.FC<Props> = (props) => {
  const { disabled = false, acting = false, children, ...buttonProps } = props;

  return (
    <Container {...buttonProps} disabled={disabled || acting}>
      {acting ? <Loader size={24} width={3} /> : children}
    </Container>
  );
};

const Container = styled.button<{ fontSize?: number }>`
  position: relative;
  transition: background-color 0.15s;
  background-color: rgba(47, 224, 200, 0.3);
  color: rgba(22, 111, 99, 0.8);
  width: ${size}px;
  height: ${size}px;
  margin: ${size / 6}px;
  padding: 0;
  font-family: 'Source Code Pro', Menlo, monospace;
  font-size: ${({ fontSize }) => fontSize ?? 16}px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  outline: none;
  display: flex;
  justify-content: center;
  align-items: center;

  :hover {
    background-color: rgba(47, 224, 200, 0.5);
  }

  :disabled {
    background-color: rgba(200, 200, 200, 0.3);
    color: rgba(100, 100, 100, 0.8);
  }
`;

export default Button;
