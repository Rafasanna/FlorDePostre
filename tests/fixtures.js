export function csvFixtures() {
  const rows = {
    menuDiario: [
      "ID interno (no tocar),Categoría,Producto,Descripción,Precio,Disponible,Reservado,Destacado,imagenes",
      'alfajor,Alfajores,Alfajor,Clásico,"4.500,50",Sí,No,Sí,https://example.com/foto.jpg',
    ],
    sinTacc: [
      "ID interno (no tocar),Producto,Descripción,Precio",
      "sin-tacc,Brownie,Sin TACC,4500",
    ],
    postres: [
      "ID interno (no tocar),Postre,Descripción",
      "postre,Chocotorta,Clásica",
    ],
    postresTamanos: [
      "ID interno (no tocar),Tamaño,Porciones",
      "size-18,18 cm,12",
    ],
    postresConfig: ["ID postre,ID Tamaño,Precio", "postre,size-18,38000"],
    campaigns: [
      "Activa,Evento,Fecha inicio,Fecha fin,Banner / texto corto,Título visible",
      "Sí,Fiesta,2026-01-01,2026-12-31,Especial,Fiesta",
    ],
    specialProducts: [
      "Activo,Evento,ID interno (no tocar),Producto,Descripción,Precio,Disponible",
      "No,Fiesta,especial,Caja,Caja especial,19000,Sí",
    ],
    tortaTamanos: [
      "ID interno (no tocar),Tamaño,Porciones,Precio",
      "size-18,18 cm,12,36900",
    ],
    tortaCoberturas: [
      "ID interno (no tocar),Cobertura",
      "buttercream,Buttercream",
    ],
    tortaRellenos: [
      "ID interno (no tocar),Relleno,Precio",
      "nutella,Nutella,4500",
    ],
    tortaExtras: [
      "ID interno (no tocar),Extra,Precio",
      "extra-pisos-falsos,Pisos falsos,15000",
    ],
  };
  return Object.fromEntries(
    Object.entries(rows).map(([k, v]) => [k, v.join("\n")]),
  );
}
