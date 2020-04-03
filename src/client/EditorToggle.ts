import styled from 'styled-components';

const EditorToggle = styled.button`
  transition: background-color 0.15s;
  position: fixed;
  padding: 0;
  top: 0;
  left: ${(props) => (props.visible ? `${props.editorWidth}px` : 0)};
  bottom: 0;
  width: 18px;
  font-size: 14px;
  color: #999999;
  border: none;
  background-color: transparent;
  cursor: pointer;
  outline: none;

  :hover {
    background-color: rgba(235, 235, 235, 0.9);
  }

  ::after {
    content: 'Edit Template';
    display: ${(props) => (props.visible ? 'none' : 'initial')};
    position: absolute;
    left: -24px;
    text-transform: uppercase;
    letter-spacing: 0.075em;
    transform: rotate(90deg);
    font-size: 12px;
    white-space: nowrap;
    padding: 0 0.25em;
    background-color: rgba(255, 255, 255, 0.85);
    pointer-events: none;
  }
`;

export default EditorToggle;
