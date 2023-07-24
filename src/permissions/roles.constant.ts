import { Permissions } from '@/permissions/permissions.constant';

export enum RolePerms {
  owner = Permissions.Read |
    Permissions.Write |
    Permissions.Delete |
    Permissions.Create |
    Permissions.Download |
    Permissions.ChangeMetadata |
    Permissions.Trash |
    Permissions.Share,
  reader = Permissions.Read | Permissions.Download,
  editor = Permissions.Read |
    Permissions.Write |
    Permissions.Trash |
    Permissions.Create |
    Permissions.Download |
    Permissions.ChangeMetadata,
  editorWithSharePerm = RolePerms.editor | Permissions.Share,
}

export type Roles = keyof typeof RolePerms;
