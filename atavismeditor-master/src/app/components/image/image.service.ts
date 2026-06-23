import {Injectable} from '@angular/core';
import {Profile} from '../../settings/profiles/profile';
import {FileItem} from '../../settings/file-manager/file-manager.interfaces';
// @ts-ignore
import * as TGAImage from 'tgaimage';
import {LogService} from '../../logs/log.service';
import {ElectronService} from '../../services/electron.service';
import * as fs from 'fs';

declare let sharp: any;
declare let PSD: any;

export enum ImageType {
  NONE = 'NONE',
  PSD = 'PSD',
  TGA = 'TGA',
  BMP = 'BMP',
  IMAGE = 'IMAGE',
}

export const IMAGE_SIZE = 128;

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private readonly fs: typeof fs;

  constructor(private readonly electronService: ElectronService, private readonly logs: LogService) {
    if (this.electronService.isElectron) {
      this.fs = this.electronService.fs;
    }
  }

  /**
   * Get File full path
   *
   * @param icon
   * @param folder
   * @param filePrefix
   */
  public getFileFullPath(icon: string, folder: string, filePrefix = false): string {
    let path;
    if (icon[0] === '/' && folder.slice(-1) === '/') {
      path = folder + icon.substr(1);
    } else if (icon[0] === '/' || folder.slice(-1) === '/') {
      path = folder + icon;
    } else {
      if (folder.length === 0) {
        path = icon;
      } else {
        path = folder + '/' + icon;
      }
    }
    const finalPath = path.replace(/\\/g, '/');
    if (!filePrefix) {
      return finalPath;
    }
    return this.electronService.isWindows ? 'file://' + finalPath : finalPath;
  }

  /**
   * Parse image type
   *
   * @param icon
   */
  public getImageType(icon: string): ImageType {
    let imageType = ImageType.NONE;
    if (icon) {
      const fileName = icon.split('/').pop();
      const ext = (fileName as string).split('.').pop();
      if (ext) {
        imageType = ImageType[ext.toUpperCase() as ImageType]
          ? ImageType[ext.toUpperCase() as ImageType]
          : ImageType.IMAGE;
      }
    }
    return imageType;
  }

  public checkIfImageExist(image: string): boolean {
    return this.fs.existsSync(image);
  }

  /**
   * parse image and get base64 of it
   *
   * @param profile: Profile
   * @param icon: string
   * @param fullBaseImage: boolean
   */
  public async parseImage(profile: Profile, icon: string, fullBaseImage = false): Promise<string> {
    try {
      let image = '';
      if (!icon) {
        if (profile.defaultImage) {
          image = this.getFileFullPath(profile.defaultImage, '');
        } else {
          return '';
        }
      } else {
        image = this.getFileFullPath(icon, profile.folder);
      }
      if (!this.fs.existsSync(image)) {
        return '';
      }
      const imageType = this.getImageType(image);
      let iconBase64 = '';
      if (imageType === ImageType.PSD) {
        const psdBase = await this.parsePsdImage(image);
        if (!psdBase) {
          return '';
        }
        const baseParts = psdBase.split(';base64,');
        if (!baseParts[1]) {
          return '';
        }
        iconBase64 = await this.resizeImage(baseParts[1], Number(profile.image_width), Number(profile.image_height));
        if (fullBaseImage && iconBase64) {
          return baseParts[0] + ';base64,' + iconBase64;
        }
      } else if (imageType === ImageType.BMP) {
        const base = this.base64Encode(image);
        if (!base) {
          return '';
        }
        if (fullBaseImage) {
          return 'data:image/png;base64,' + base;
        }
        return base;
      } else if (imageType === ImageType.TGA) {
        const base = await this.parseTgaBase(profile, image);
        if (!base) {
          return '';
        }
        const baseParts = base.split(';base64,');
        if (!baseParts[1]) {
          return '';
        }
        iconBase64 = await this.resizeImage(baseParts[1], Number(profile.image_width), Number(profile.image_height));
        if (fullBaseImage && iconBase64) {
          return baseParts[0] + ';base64,' + iconBase64;
        }
      } else if (imageType === ImageType.IMAGE) {
        iconBase64 = await this.resizeRealImage(image, Number(profile.image_width), Number(profile.image_height));
        if (fullBaseImage && iconBase64) {
          const ext = (image.split('.').pop() as string).toLowerCase();
          return 'data:image/' + ext + ';base64,' + iconBase64;
        }
      }
      return iconBase64;
    } catch (e) {
      this.logs.error('[ImageService.parseImage]', e);
      return '';
    }
  }

  public async parseTgaBase(profile: Profile, icon: string): Promise<any> {
    return new Promise((resolve) => {
      try {
        if (icon) {
          let image = icon;
          if (icon.indexOf(profile.folder) === -1) {
            image = this.getFileFullPath(icon, profile.folder);
          }
          if (!this.fs.existsSync(image)) {
            resolve('');
          } else {
            const tgaImage = TGAImage.imageWithURL(image);
            tgaImage.didLoad.then(() => {
              try {
                const tmpDiv = document.createElement('div');
                tmpDiv.appendChild(tgaImage.image);
                const tmpImg = tmpDiv.getElementsByTagName('img');
                resolve(tmpImg[0].src);
              } catch (e) {
                resolve('');
              }
            });
          }
        } else {
          resolve('');
        }
      } catch (e) {
        this.logs.error('[ImageService.parseTgaBase]', e);
        resolve('');
      }
    });
  }

  /**
   * Encode image to base64 string
   *
   * @param file
   */
  public base64Encode(file: string): string {
    const bitmap = this.fs.readFileSync(file);
    return Buffer.from(bitmap).toString('base64');
  }

  /**
   * Decode base64 to file
   *
   * @param base64str
   * @param file
   */
  public base64Decode(base64str: string, file: string): void {
    const bitmap = Buffer.from(base64str, 'base64');
    this.fs.writeFileSync(file, bitmap);
  }

  /**
   * Resize Image into passed sizes
   *
   * @param base64Image
   * @param maxWidth
   * @param maxHeight
   */
  public async resizeImage(
    base64Image: string,
    maxWidth: number = IMAGE_SIZE,
    maxHeight: number = IMAGE_SIZE,
  ): Promise<string> {
    return new Promise((res) => {
      try {
        maxWidth = maxWidth || IMAGE_SIZE;
        maxHeight = maxHeight || IMAGE_SIZE;
        const img = Buffer.from(base64Image, 'base64');
        sharp(img)
          .resize(maxWidth, maxHeight)
          .toBuffer()
          .then((resizedImageBuffer: {toString: (arg0: string) => any}) => {
            const resizedImageData = resizedImageBuffer.toString('base64');
            res(resizedImageData);
          })
          .catch((error: any) => {
            console.error('tga error', error);
            res(base64Image);
          });
      } catch (e) {
        this.logs.error('[ImageService.resizeImage]', e);
        res(base64Image);
      }
    });
  }

  public async resizeRealImage(
    image: string,
    maxWidth: number = IMAGE_SIZE,
    maxHeight: number = IMAGE_SIZE,
  ): Promise<string> {
    return new Promise((res) => {
      try {
        maxWidth = maxWidth || IMAGE_SIZE;
        maxHeight = maxHeight || IMAGE_SIZE;
        sharp(image)
          .resize(maxWidth, maxHeight)
          .toBuffer()
          .then((resizedImageBuffer: {toString: (arg0: string) => any}) => {
            const resizedImageData = resizedImageBuffer.toString('base64');
            res(resizedImageData);
          })
          .catch((error: any) => {
            this.logs.error('[ImageService.resizeRealImage toBuffer]', error);
            res(this.base64Encode(image));
          });
      } catch (e) {
        this.logs.error('[ImageService.resizeRealImage]', e);
        res(this.base64Encode(image));
      }
    });
  }

  /**
   * Parse psd images
   *
   * @param fileSrc
   */
  public async parsePsdImage(fileSrc: string): Promise<string> {
    return new Promise((resolve) => {
      PSD.fromURL(fileSrc).then((psd: any) => {
        try {
          const imagePng = psd.image.toPng();
          const tmpDiv = document.createElement('div');
          tmpDiv.appendChild(imagePng);
          const tmpImg = tmpDiv.getElementsByTagName('img');
          resolve(tmpImg[0].src);
        } catch (e) {
          this.logs.error('[ImageService.parsePsdImage]', e);
          resolve('');
        }
      });
    });
  }

  public parseImagePath(fileItem: FileItem): string {
    const relativePath = fileItem.relative_path.replace(/\\/g, '/');
    const simplePath = fileItem.path.replace(/\\/g, '/');
    let fileSrc = relativePath;
    if (relativePath === simplePath && simplePath.includes('Assets')) {
      const fileSourceList = simplePath.split('Assets');
      if (fileSourceList.length > 1) {
        const folderSelected = [];
        for (let i = 0; i < fileSourceList.length; ++i) {
          if (i !== 0) {
            folderSelected.push('Assets');
            folderSelected.push(fileSourceList[i]);
          }
        }
        fileSrc = folderSelected.join('');
      }
    } else if (!relativePath.includes('Assets/') && simplePath.includes('/Assets')) {
      const fileSourceList = simplePath.split('Assets');
      if (fileSourceList.length > 1) {
        const folderSelected = [];
        for (let i = 0; i < fileSourceList.length; ++i) {
          if (i !== 0) {
            folderSelected.push('Assets');
            folderSelected.push(fileSourceList[i]);
          }
        }
        fileSrc = folderSelected.join('');
      }
    }
    return fileSrc;
  }
}
