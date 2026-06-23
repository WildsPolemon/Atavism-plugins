export const metaFileExtension = '.meta';

export interface FileItem {
  path: string;
  relative_path: string;
  title: string;
  name: string;
  ext: string;
  src?: string;
  icon?: {icon: string; folder: string | undefined};
}

export enum FileExtension {
  psd = 'psd',
  png = 'png',
  tga = 'tga',
  jpg = 'jpg',
  jpeg = 'jpeg',
  gif = 'gif',
}
