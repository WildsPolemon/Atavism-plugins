export interface FuseConfig {
  colorTheme: string;
  fontSize: string;
  tooltipFontSize: string;
  customScrollbars: boolean;
  customColors: {
    mainColor: string;
    secondaryColor: string;
    textColor: string;
    textSecondaryColor: string;
    primaryColor: string;
    accentColor: string;
    warnColor: string;
  };
  layout: {
    style: string;
    width: 'fullwidth' | 'boxed';
    navbar: {
      primaryBackground: string;
      secondaryBackground: string;
      hidden: boolean;
      folded: boolean;
      position: 'left' | 'right' | 'top';
      variant: string;
    };
    toolbar: {
      customBackgroundColor: boolean;
      background: string;
      hidden: boolean;
      position: 'above' | 'above-static' | 'above-fixed' | 'below' | 'below-static' | 'below-fixed';
    };
    footer: {
      customBackgroundColor: boolean;
      background: string;
      hidden: boolean;
      position: 'above' | 'above-static' | 'above-fixed' | 'below' | 'below-static' | 'below-fixed';
    };
    sidepanel: {
      hidden: boolean;
      position: 'left' | 'right';
    };
  };
  autoCheckForUpdate: boolean;
}
