export interface datatype {
  date: string;
  location: string;
  name: string;
  size: number;
  type: string;
  url: string;
  group?: string;
}

export type themeType = {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  secondaryText?: string;
  invertImage: boolean;
};

export interface imageType {
  date: string;
  data: datatype[];
}

export interface fileType {
  date: string;
  data: datatype[];
}
