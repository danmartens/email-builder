import styled from 'styled-components';

const size = 36;

const Button = styled.button`
  transition: background-color 0.15s;
  background-color: rgba(47, 224, 200, 0.3);
  color: rgba(22, 111, 99, 0.8);
  width: ${size}px;
  height: ${size}px;
  margin: ${size / 6}px;
  padding: 0;
  font-family: 'Source Code Pro', Menlo, monospace;
  font-size: ${(props) => props.fontSize}px;
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
`;

Button.defaultProps = {
  fontSize: 16
};

export default Button;
