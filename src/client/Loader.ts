import styled from 'styled-components';

const Loader = styled.div`
  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(350deg);
    }
  }

  font-size: 32px;
  border-width: 4px;

  position: absolute;
  top: 50%;
  left: 50%;

  box-sizing: border-box;
  width: 1em;
  height: 1em;
  margin: -0.5em 0 0 -0.5em;

  animation: rotation 0.95s infinite linear;

  border-style: solid;
  border-color: #eeeeee;
  border-top-color: #cccccc;
  border-radius: 0.5em;
`;

export default Loader;
