import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
  // MaterialUIのCSSを上書きする
  overrides: {
    MuiGrid: {
      item: {
        padding: 12,
        width: '100%',
      },
    },
    MuiOutlinedInput: {
      input: {
        padding: 5,
      },
    },
  },
  // MaterialUIのCSSのオンオフ切り替える
  props: {},
});
export default theme;
