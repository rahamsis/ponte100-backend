import { Injectable } from "@nestjs/common";

@Injectable()
export class Util {

    constructor() { }

    nextCode(code: string): string {
        // 1. Extraer las letras iniciales
        const prefix = code.match(/[A-Za-z]+/)?.[0] ?? "";

        // 2. Extraer la parte numérica
        const numberPart = code.match(/\d+/)?.[0] ?? "0";

        // 3. Convertir a número e incrementar
        const nextNumber = (parseInt(numberPart, 10) + 1).toString();

        // 4. Rellenar con ceros a la izquierda según la longitud original
        const paddedNumber = nextNumber.padStart(numberPart.length, "0");

        return prefix + paddedNumber;
    }

    buildTreeToAcces(
        menuCompleto: any[],
        permisosCompletos: any[],
        perfilMenu: any[],
        perfilSubMenu: any[],
        perfilPermiso: any[]
    ) {
        const menuSet = new Set(perfilMenu.filter(m => m.estadoMenu === 1).map(m => m.idMenu));
        const submenuSet = new Set(perfilSubMenu.filter(s => s.estadoSubMenu === 1).map(s => s.idSubMenu));
        const permisoSet = new Set(perfilPermiso.filter(p => p.estadoPermiso === 1).map(p => p.idPermiso));

        // Agrupar menús
        const menuMap = new Map<string, any>();

        // Menús y submenús
        menuCompleto.forEach(row => {
            if (!menuMap.has(row.idMenu)) {
                menuMap.set(row.idMenu, {
                    id: row.idMenu,
                    type: "MENU",
                    label: row.nombreMenu,
                    checked: menuSet.has(row.idMenu),
                    children: [],
                });
            }

            if (row.idSubMenu) {
                menuMap.get(row.idMenu).children.push({
                    id: row.idSubMenu,
                    type: "SUBMENU",
                    label: row.nombreSubMenu,
                    checked: submenuSet.has(row.idSubMenu),
                    children: [],
                });
            }
        });

        // Index submenús
        const subMenuMap = new Map<string, any>();
        menuMap.forEach(menu => {
            menu.children.forEach(sub => subMenuMap.set(sub.id, sub));
        });

        // Permisos
        permisosCompletos.forEach(p => {
            const sub = subMenuMap.get(p.idSubMenu);
            if (!sub) return;

            sub.children.push({
                id: p.idPermiso,
                type: "PERMISO",
                label: p.nombre,
                checked: permisoSet.has(p.idPermiso),
                children: [],
            });
        });

        return Array.from(menuMap.values());
    }
}