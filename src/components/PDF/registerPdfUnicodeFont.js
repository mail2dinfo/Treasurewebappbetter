import { Font } from '@react-pdf/renderer';
import hindMaduraiRegular from '../../assets/fonts/hindMaduraiRegular.datauri.js';

export const PDF_UNICODE_FONT = 'HindMadurai';

const fontSrc = String(hindMaduraiRegular || '').replace(
  /^data:font\/ttf/i,
  'data:application/octet-stream'
);

let registered = false;

export const registerPdfUnicodeFont = () => {
  if (registered) return;
  Font.register({
    family: PDF_UNICODE_FONT,
    fonts: [
      { src: fontSrc, fontWeight: 'normal', fontStyle: 'normal' },
      { src: fontSrc, fontWeight: 400, fontStyle: 'normal' },
      { src: fontSrc, fontWeight: 'bold', fontStyle: 'normal' },
      { src: fontSrc, fontWeight: 700, fontStyle: 'normal' },
      { src: fontSrc, fontWeight: 'normal', fontStyle: 'italic' },
      { src: fontSrc, fontWeight: 'bold', fontStyle: 'italic' },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
};

registerPdfUnicodeFont();
