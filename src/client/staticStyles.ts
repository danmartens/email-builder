export default `
  /* Reset for Windows Mail 10 */
  a { text-decoration: none; }

  /* Reset for MS Office */
  p { margin: 0; }

  @media only screen and (-webkit-min-device-pixel-ratio: 2),
                         (min-resolution: 192dpi) {
    .non-retina-image {
      display: none !important;
    }

    .retina-image {
      display: block !important;
    }
  }
`;
