import React from 'react';
import axios from 'axios';

import Loader from './Loader';

interface Props {
  value: string;
  maxWidth: number;
  maxHeight: number;
  onUpload(url: string): void;
}

type State = {
  status: null | 'pending' | 'success' | 'error';
  file: Blob;
  imageDataUrl?: string;
};

export default class ImageUploader extends React.PureComponent<Props, State> {
  state = { status: null, file: null, imageDataUrl: null };

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.file !== this.state.file) {
      this.setState({ status: 'pending' });

      const { maxWidth, maxHeight } = this.props;
      const { file } = this.state;

      const reader = new FileReader();

      reader.addEventListener(
        'load',
        () => {
          this.setState({ imageDataUrl: reader.result as string });
        },
        false
      );

      reader.readAsDataURL(file);

      const data = new FormData();

      data.set('image', file);
      data.set('maxWidth', maxWidth.toString());
      data.set('maxHeight', maxHeight.toString());

      axios.post('/images', data).then(({ data }) => {
        this.setState({ status: 'success' });

        this.props.onUpload(data.imageUrl);
      });
    }
  }

  render() {
    const { value, maxWidth, maxHeight } = this.props;
    const { imageDataUrl, status } = this.state;

    return (
      <div style={{ marginBottom: '1em' }}>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.gif"
          onChange={(event) => {
            this.setState({ file: event.currentTarget.files[0] });
          }}
        />

        {maxWidth != null && maxHeight != null && (
          <p
            style={{
              fontSize: 12,
              fontFamily: 'sans-serif',
              color: '#666666',
              lineHeight: '1.5em'
            }}
          >
            The uploaded image will be resized to fit within{' '}
            <b>
              {maxWidth}
              &times;
              {maxHeight}
              px
            </b>
            . Please choose an image at least this large.
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '1em',
            position: 'relative',
            padding: '1em'
          }}
        >
          <img
            src={imageDataUrl || value}
            style={{ width: '80%', opacity: status === 'pending' ? 0.75 : 1 }}
          />

          {status === 'pending' && <Loader />}
        </div>
      </div>
    );
  }
}
