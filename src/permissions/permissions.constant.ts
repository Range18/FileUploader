export enum Permissions {
  Read = 1,
  Write = 2,
  Create = 4,
  Delete = 8,
  ChangeMetadata = 16,
  Download = 32,
  Trash = 64,
  Share = 128,
}

export type PermissionsAsStr = keyof typeof Permissions;
