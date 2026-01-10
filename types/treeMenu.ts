interface TreeNode {
    id: string;
    type: 'menu' | 'submenu' | 'permiso';
    label: string;
    children: TreeNode[];
    checked?: boolean;
}

interface PermisoInfo {
  idPermiso: string;
  idMenu: string;
  idSubMenu: string;
}