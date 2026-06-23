export interface Translations {
  id: string;
  code: string;
  name: string;
  selected: boolean;
  default: boolean;
}

export interface Translation {
  id: string;
  code: string;
  name: string;
  file: string;
  default: boolean;
  translation: any;
}
