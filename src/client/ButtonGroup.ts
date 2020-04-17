import styled from 'styled-components';

const ButtonGroup = styled.div<{
  top?: number;
  bottom?: 'auto' | number;
  right?: number;
}>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
  top: ${(props) => props.top};
  bottom: ${(props) => props.bottom};
  right: ${(props) => props.right};
`;

ButtonGroup.defaultProps = {
  top: 0,
  bottom: 'auto',
  right: 0
};

export default ButtonGroup;
