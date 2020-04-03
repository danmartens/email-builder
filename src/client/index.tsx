import React from 'react';
import ReactDOM from 'react-dom';
import ToggleSource from './ToggleSource';
import ValuesEditor from './ValuesEditor';
import Frame from './Frame';
import ButtonGroup from './ButtonGroup';
import storeValues from './utils/storeValues';
import fetchValues from './utils/fetchValues';
import Values from './Values';
import { Schema } from '../types';

declare global {
  interface Window {
    EMAIL: { name: string; schema: Schema };
  }
}

interface Props {}

type State = { editorVisible: boolean; sourceVisible: boolean; values: Values };

function getEditorVisible(): boolean {
  try {
    return JSON.parse(sessionStorage.getItem('editorVisible') || 'false');
  } catch (error) {
    return false;
  }
}

const { EMAIL } = window;

class Email extends React.PureComponent<Props, State> {
  static defaultProps = { schema: {} };

  state = {
    editorVisible: getEditorVisible(),
    sourceVisible: false,
    values: new Values(fetchValues(EMAIL.name, EMAIL.schema))
  };

  componentDidMount() {
    this.updateMargin();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.editorVisible !== this.state.editorVisible) {
      this.updateMargin();

      try {
        sessionStorage.setItem(
          'editorVisible',
          JSON.stringify(this.state.editorVisible)
        );
      } catch (error) {}
    }

    if (prevState.values !== this.state.values) {
      storeValues(EMAIL.name, this.state.values);
    }
  }

  updateMargin() {
    if (document.body == null) {
      return;
    }

    if (this.state.editorVisible) {
      document.body.style.marginLeft = '300px';
    } else {
      document.body.style.marginLeft = '0';
    }
  }

  render() {
    const { values, editorVisible, sourceVisible } = this.state;

    return (
      <>
        <ButtonGroup>
          <ToggleSource
            sourceVisible={sourceVisible}
            onClick={() => {
              this.setState({ sourceVisible: !sourceVisible });
            }}
          />
        </ButtonGroup>

        <Frame
          editorVisible={editorVisible}
          emailName="newsletter"
          values={values}
        />

        <ValuesEditor
          schema={EMAIL.schema}
          values={values}
          visible={editorVisible}
          onToggle={() => {
            this.setState({ editorVisible: !editorVisible });
          }}
          onChange={(values) => {
            this.setState({ values });
          }}
        />
      </>
    );
  }
}

ReactDOM.render(<Email />, document.getElementById('container'));
