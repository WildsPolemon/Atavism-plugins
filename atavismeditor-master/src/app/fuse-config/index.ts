import {FuseConfig} from '@fuse/types';

export const fuseConfig: FuseConfig = {
  colorTheme: 'theme-default',
  fontSize: 'font-size-normal',
  tooltipFontSize: 'tooltip-font-size-normal',
  customScrollbars: true,
  customColors: {
    mainColor: '#f5f5f5',
    secondaryColor: '#000000',
    textColor: '#000000',
    textSecondaryColor: '#000000',
    primaryColor: '#3c4252',
    accentColor: '#039be5',
    warnColor: '#f44336',
  },
  layout: {
    style: 'vertical-layout-1',
    width: 'fullwidth',
    navbar: {
      primaryBackground: 'fuse-navy-700',
      secondaryBackground: 'fuse-navy-900',
      folded: false,
      hidden: false,
      position: 'left',
      variant: 'vertical-style-1',
    },
    toolbar: {
      customBackgroundColor: false,
      background: 'fuse-white-500',
      hidden: false,
      position: 'below-static',
    },
    footer: {
      hidden: true,
      customBackgroundColor: true,
      background: 'fuse-navy-900',
      position: 'below-fixed',
    },
    sidepanel: {
      hidden: false,
      position: 'right',
    },
  },
  autoCheckForUpdate: true,
};
