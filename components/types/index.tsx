export interface datatype {
  date: string;
  location: string;
  name: string;
  size: number;
  type: string;
  url: string;
  group?: string;
  /** Cloudinary identifiers, absent on items uploaded before the swap. */
  publicId?: string;
  resourceType?: string;
}

export type sidebarType = {
  primary: string;
  hover: string;
  text: string;
  invertImage: boolean;
};

export type themeType = {
  sidebar?: sidebarType;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  secondaryText?: string;
  border: string;
  muted: string;
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
