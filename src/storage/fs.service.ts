import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileSystemEntity } from '@/storage/entities/fileSystemEntity';
import { FILE_NAMES_SIZE } from '@/storage/storage.constants';
import { storageConfig } from '@/common/configs/storageConfig';
import { isDevMode } from '@/common/configs/config';
import { OtherExceptions } from '@/common/Exceptions/ExceptionTypes/OtherExceptions';
import * as yauzl from 'yauzl';
import { Entry, ZipFile } from 'yauzl';
import * as mime from 'mime';
import { Repository } from 'typeorm';
import { uid } from 'uid';
import * as archiver from 'archiver';
import { mkdir, rename, stat, unlink } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { createWriteStream } from 'fs';
import { spawn } from 'child_process';

@Injectable()
export class FsService implements OnModuleInit {
  constructor(
    @InjectRepository(FileSystemEntity)
    private readonly fsRepository: Repository<FileSystemEntity>,
  ) {}

  async onModuleInit() {
    if (!(await this.checkPathExists(storageConfig.storagePath))) {
      throw new Error(OtherExceptions.StorageRepNotFound);
    }
  }

  async saveAsFolder(
    file: Express.Multer.File,
    FolderDestination: string,
    unzipToDir: string,
    userUUID: string,
  ): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      yauzl.open(
        `.\\${file.path}`,
        { lazyEntries: true },
        async (err, zipfile: ZipFile) => {
          if (err) {
            zipfile?.close();
            await this.deleteFile(`.\\${file.path}`);
            reject(err);
          }

          const processedFolders: Map<
            string,
            { name: string; path: string; size: number }
          > = new Map();

          zipfile?.readEntry();

          zipfile?.on('entry', async (entry: Entry) => {
            // Directories
            if (/\/$/.test(entry.fileName)) {
              // Create the directory then read the next entry.
              const originalPath = entry.fileName;
              let pathToReplace = '';

              for (const key of processedFolders.keys()) {
                if (
                  originalPath.includes(key) &&
                  key.length > pathToReplace.length
                ) {
                  pathToReplace = key;
                }
              }

              const replacedPath = pathToReplace
                ? originalPath.replace(
                    pathToReplace,
                    processedFolders.get(pathToReplace).path,
                  )
                : originalPath;
              const genDirname = uid(FILE_NAMES_SIZE);
              const replacedPathArr = replacedPath.split('/');

              replacedPathArr.pop();
              replacedPathArr.pop();

              const folderPath =
                replacedPathArr.join('/') + '/' + genDirname + '/';
              processedFolders.set(originalPath, {
                name: genDirname,
                path: folderPath,
                size: 0,
              });

              await this.mkDir(join(unzipToDir, folderPath));

              await this.fsRepository.save({
                owner: { UUID: userUUID },
                originalName: entry.fileName.split('/').slice(-2, -1).at(-1),
                name: genDirname,
                destination: join(
                  FolderDestination,
                  replacedPathArr.join('/') + '/',
                ),
                type: 'folder',
                size: entry.compressedSize,
              });

              zipfile.readEntry();
            }
            //Files
            else {
              zipfile.openReadStream(entry, (readFileErr, readStream) => {
                if (readFileErr) {
                  zipfile.close();
                  reject(err);
                }

                const originalPath = entry.fileName;
                let pathToReplace = '';

                for (const key of processedFolders.keys()) {
                  if (
                    originalPath.includes(key) &&
                    key.length > pathToReplace.length
                  ) {
                    pathToReplace = key;
                  }
                }

                const replacedPath = pathToReplace
                  ? originalPath.replace(
                      pathToReplace,
                      processedFolders.get(pathToReplace).path,
                    )
                  : originalPath;
                const replacedPathArr = replacedPath.split('/');

                replacedPathArr.pop();

                const generatedName = uid(FILE_NAMES_SIZE);
                const dest = replacedPathArr.join('/') + '/';
                const filename = `${generatedName}${extname(entry.fileName)}`;
                const filepath = `${dest}${filename}`;

                const file = createWriteStream(join(unzipToDir, filepath));

                readStream.pipe(file);

                file.on('finish', async () => {
                  await this.fsRepository.save({
                    owner: { UUID: userUUID },
                    originalName: entry.fileName.split('/').slice(-1).join(''),
                    name: filename,
                    destination: normalize(FolderDestination + dest),
                    type: mime.getType(join(unzipToDir, filepath)),
                    size: entry.uncompressedSize,
                  });

                  const folder = processedFolders.get(pathToReplace);

                  processedFolders.set(pathToReplace, {
                    name: folder.name,
                    path: folder.path,
                    size: folder.size + entry.uncompressedSize,
                  });

                  zipfile.readEntry();
                });

                file.on('error', async (err) => {
                  zipfile.close();
                  await this.deleteFile(`./${file.path}`);
                  reject(err);
                });
              });
            }
          });

          zipfile?.on('error', async (err) => {
            zipfile?.close();
            await this.deleteFile(`./${file.path}`);
            reject(err);
          });

          zipfile?.on('end', async () => {
            await this.deleteFile(`./${file.path}`);

            for (const folder of processedFolders.values()) {
              let totalSize: number = folder.size;

              for (const anotherFolder of processedFolders.values()) {
                if (
                  folder != anotherFolder &&
                  this.isParent(
                    folder.name,
                    anotherFolder.name,
                    anotherFolder.path,
                  )
                ) {
                  totalSize += anotherFolder.size;
                }
              }

              const fsEntity = await this.fsRepository.findOne({
                where: {
                  name: folder.name,
                },
              });

              fsEntity.size = totalSize;
              await this.fsRepository.save(fsEntity);
            }

            resolve();
          });
        },
      );
    });
  }

  async zipFolder(path: string): Promise<string>;
  async zipFolder(fileEntity: FileSystemEntity): Promise<string>;
  async zipFolder(
    fileEntityOrPath: string | FileSystemEntity,
  ): Promise<string> {
    const archive = archiver.create('zip', {
      zlib: { level: storageConfig.compressionLevel },
    });

    const isPath = typeof fileEntityOrPath === 'string';

    const driveUUID = isPath
      ? normalize(fileEntityOrPath).split('\\').at(-1)
      : fileEntityOrPath.owner.UUID;

    let outputPath: string;

    if (isPath) {
      outputPath =
        fileEntityOrPath +
        '\\' +
        normalize(fileEntityOrPath).split('\\').at(-1) +
        '.zip';
    } else {
      outputPath = join(
        storageConfig.storagePath,
        fileEntityOrPath.destination,
        `${fileEntityOrPath.name}.zip`,
      );
    }

    const output = createWriteStream(outputPath);

    if (isDevMode) {
      output.on('close', () => {
        console.log(archive.pointer() + ' total bytes');
      });
    }

    archive.on('warning', (error) => {
      if (error.code === 'ENOENT') {
        console.log(error);
      } else {
        throw error;
      }
    });

    archive.on('error', (error) => {
      throw error;
    });

    archive.pipe(output);

    const pathToZip = isPath
      ? fileEntityOrPath
      : join(
          storageConfig.storagePath,
          fileEntityOrPath.owner.UUID,
          fileEntityOrPath.name,
        );

    const name = isPath ? driveUUID : fileEntityOrPath.name;

    archive.directory(pathToZip, name);

    await archive.finalize();
    output.close();

    return outputPath;
  }

  async checkPathExists(path: string): Promise<boolean> {
    return await stat(path)
      .then(() => true)
      .catch(() => false);
  }

  makeFileInvisible(path: string) {
    spawn('attrib', ['+h', path]);
  }

  async deleteFile(path: string) {
    await unlink(path).catch((err) => {
      throw err;
    });
  }

  async moveFile(oldPath: string, newPath: string) {
    await rename(oldPath, newPath).catch((err) => {
      throw err;
    });
  }

  async mkDir(path: string) {
    await mkdir(path).catch((err) => {
      throw err;
    });
  }

  isParent(folderName: string, folderToCheck: string, path: string): boolean {
    if (!path.includes(folderName) || !path.includes(folderToCheck))
      return false;

    const normalizedPath = normalize(path);

    const pathEntries = normalizedPath.split('\\');
    let [firstFolderProcessed, folderToCheckProcessed] = [false, false];

    for (const entry of pathEntries) {
      firstFolderProcessed = folderName === entry;
      folderToCheckProcessed = folderToCheck === entry;

      if (firstFolderProcessed && !folderToCheckProcessed) {
        return true;
      }

      if (!firstFolderProcessed && folderToCheckProcessed) {
        return false;
      }
    }

    return true;
  }
}
