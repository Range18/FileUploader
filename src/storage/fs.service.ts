import { Injectable } from '@nestjs/common';
import * as yauzl from 'yauzl';
import { Entry, ZipFile } from 'yauzl';
import { mkdir, rename, stat, unlink } from 'fs/promises';
import * as path from 'path';
import { extname, join, normalize } from 'path';
import * as mime from 'mime';
import { createWriteStream } from 'fs';
import { Like, Repository } from 'typeorm';
import { FileSystemEntity } from '@/storage/entities/fileSystemEntity';
import { InjectRepository } from '@nestjs/typeorm';
import { spawn } from 'child_process';
import { uid } from 'uid';
import { FILE_NAMES_SIZE } from '@/storage/storage.constants';
import { storageConfig } from '@/common/configs/storageConfig';
import * as archiver from 'archiver';
import { isDevMode } from '@/common/configs/config';

@Injectable()
export class FsService {
  constructor(
    @InjectRepository(FileSystemEntity)
    private readonly fsRepository: Repository<FileSystemEntity>,
  ) {}

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
                driveUUID: userUUID,
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
                    driveUUID: userUUID,
                    originalName: entry.fileName.split('/').slice(-1).join(''),
                    name: filename,
                    destination: normalize(FolderDestination + dest),
                    //TODO Why not default column value
                    type: mime.getType(join(unzipToDir, filepath)) ?? 'untyped',
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

  async zipFolder(fileEntity: FileSystemEntity): Promise<string> {
    const archive = archiver.create('zip', {
      zlib: { level: storageConfig.compressionLevel },
    });
    const outputPath = path.join(
      storageConfig.storagePath,
      fileEntity.destination,
      `${fileEntity.name}.zip`,
    );
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

    const childFiles: FileSystemEntity[] = await this.fsRepository.find({
      where: { destination: Like(`%${fileEntity.name}%`) },
    });

    for (const childFile of childFiles) {
      if (childFile.type === 'folder') {
        archive.directory(
          path.join(
            storageConfig.storagePath,
            childFile.destination,
            childFile.name,
          ),
          childFile.name,
        );
      } else if (
        childFile.destination ===
        join(fileEntity.destination, fileEntity.name) + '\\'
      ) {
        archive.file(
          join(
            storageConfig.storagePath,
            childFile.destination,
            childFile.name,
          ),
          { name: childFile.name },
        );
      }
    }

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
