import { Injectable } from '@nestjs/common';
import * as yauzl from 'yauzl';
import { Entry, ZipFile } from 'yauzl';
import { mkdir, stat, unlink } from 'fs/promises';
import { extname, join } from 'path';
import * as mime from 'mime';
import { createWriteStream } from 'fs';
import * as uuid4 from 'uuid4';
import { Repository } from 'typeorm';
import { FileSystemEntity } from '@/storage/entities/fileSystemEntity';
import { InjectRepository } from '@nestjs/typeorm';
import { spawn } from 'child_process';

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
            await unlink(`.\\${file.path}`);
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
              //TODO save current size
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
              const genDirname = uuid4();
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

              await mkdir(join(unzipToDir, folderPath));

              await this.fsRepository.save({
                ownerUUID: userUUID,
                originalName: entry.fileName.split('/').slice(-2, -1).at(-1),
                name: genDirname,
                destination: join(
                  FolderDestination,
                  replacedPathArr.join('/') + '/',
                ),
                type: mime.getType(join(unzipToDir, folderPath)) ?? 'folder',
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

                const generatedName = uuid4();
                const dest = replacedPathArr.join('/') + '/';
                const filename = `${generatedName}${extname(entry.fileName)}`;
                const filepath = `${dest}${filename}`;

                const file = createWriteStream(join(unzipToDir, filepath));

                readStream.pipe(file);

                file.on('finish', async () => {
                  await this.fsRepository.save({
                    ownerUUID: userUUID,
                    originalName: entry.fileName.split('/').slice(-1).join(''),
                    name: filename,
                    destination: join(FolderDestination + dest),
                    type: mime.getType(join(unzipToDir, filepath)),
                    size: entry.uncompressedSize,
                  });
                  const folder = processedFolders.get(pathToReplace);
                  processedFolders.set(pathToReplace, {
                    name: folder.name,
                    path: folder.path,
                    size: folder.size + entry.uncompressedSize,
                  });
                  console.log(processedFolders);
                  zipfile.readEntry();
                });

                file.on('error', (err) => {
                  zipfile.close();
                  reject(err);
                });
              });
            }
          });

          zipfile?.on('error', async (err) => {
            zipfile?.close();
            await unlink(`./${file.path}`);
            reject(err);
          });

          zipfile?.on('end', async () => {
            await unlink(`./${file.path}`);
            for (const folder of processedFolders.values()) {
              const fsEntity = await this.fsRepository.findOne({
                where: {
                  name: folder.name,
                },
              });
              fsEntity.size = folder.size;
              await this.fsRepository.save(fsEntity);
            }
            resolve();
          });
        },
      );
    });
  }

  async checkPathExists(path: string): Promise<boolean> {
    return await stat(path)
      .then(() => true)
      .catch(() => false);
  }

  makeFileInvisible(path: string) {
    spawn('attrib', ['+h', path]);
  }
}
