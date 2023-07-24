export enum FileExceptions {
  FileNotFound = 'File not found',
  ObjectAccessFail = 'No permissions to this file or directory',
  DirAlreadyExists = 'Directory already exists',
  DirNotFound = 'Directory not found',
  StorageNotFound = 'Storage not found',
  FileNotTrashed = 'File is not trashed',
  FileAlreadyTrashed = 'That file is already trashed',
  FileTrashed = 'File has been trashed',
  SomethingWithFile = 'Something went wrong with that file',
  SomethingWhileUnpacking = 'Something went wrong while unpacking',
}
