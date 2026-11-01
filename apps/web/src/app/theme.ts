import type { ThemeConfig } from 'antd';

type BrandTheme = {
  primaryColor: string;
};

// Product default; a future business configuration must be validated before use here.
const defaultBrand: BrandTheme = { primaryColor: '#1677ff' };

function createAppTheme(brand: BrandTheme): ThemeConfig {
  return {
    token: {
      colorPrimary: brand.primaryColor,
      borderRadius: 6,
      fontFamily: 'system-ui, sans-serif',
    },
  };
}

export const appTheme = createAppTheme(defaultBrand);
