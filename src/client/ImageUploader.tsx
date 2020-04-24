import React from 'react';
import Loader from './Loader';

interface Props {
  value?: { src: string; srcset: string };
  maxWidth?: number;
  maxHeight?: number;
  onUpload(result: { src: string; srcset: string }): void;
}

type State = {
  status: 'pending' | 'success' | 'error' | null;
  file: Blob | null;
  imageDataUrl: string | null;
};

export default class ImageUploader extends React.PureComponent<Props, State> {
  state: State = { status: null, file: null, imageDataUrl: null };

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.file !== this.state.file && this.state.file != null) {
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

      if (maxWidth != null) {
        data.set('maxWidth', maxWidth.toString());
      }

      if (maxHeight != null) {
        data.set('maxHeight', maxHeight.toString());
      }

      fetch('/images', {
        method: 'post',
        body: data
      })
        .then((response) => response.json())
        .then((responseBody) => {
          this.setState({ status: 'success' });

          this.props.onUpload(responseBody);
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
            this.setState({ file: event.currentTarget.files![0] });
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
            src={imageDataUrl || value?.src}
            style={{ width: '80%', opacity: status === 'pending' ? 0.75 : 1 }}
          />

          {status === 'pending' && <Loader />}
        </div>
      </div>
    );
  }
}
