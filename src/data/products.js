// Editar productos, categorias e imagenes desde este archivo.
// Para agregar imagenes nuevas, guardarlas en /public/images y usar rutas como "/images/nombre.jpeg".
export const categories = [
  "Todos",
  "Alfajores",
  "Cookies",
  "Budines",
  "Tortas",
  "Lingotes",
  "Mini tartas",
  "Otros dulces",
  "Salado",
  "Bandejas",
  "Postres",
  "Extras"
];

export const products = [
  {
    id: "alfajor-santafesino",
    nombre: "Alfajor santafesino",
    descripcion: "Alfajor tradicional santafesino relleno de dulce de leche, bañado en glasé.",
    precio: 4500,
    categoria: "Alfajores",
    imagen: "/images/carousel-1.jpg"
  },
  {
    id: "alfa-triple-brownie",
    nombre: "Alfa triple brownie",
    descripcion: "Relleno de dulce de leche y café.",
    precio: 4900,
    categoria: "Alfajores",
    imagen: "/images/carousel-2.jpg"
  },
  {
    id: "alfajor-pistacho",
    nombre: "Alfajor de pistacho",
    descripcion: "Chocolate blanco y frutos rojos.",
    precio: 5200,
    categoria: "Alfajores",
    imagen: "/images/carousel-3.jpg"
  },
  {
    id: "alfajor-nutella-mani",
    nombre: "Alfajor Nutella y maní",
    descripcion: "Alfajor de cacao, relleno con Nutella y cubierto con trozos de maní.",
    precio: 5000,
    categoria: "Alfajores",
    imagen: "/images/carousel-4.jpg"
  },
  {
    id: "alfajor-coco-dulce-leche",
    nombre: "Alfajor de coco y dulce de leche",
    descripcion: "Alfajor artesanal con masa de coco y dulce de leche.",
    precio: 4900,
    categoria: "Alfajores",
    imagen: "/images/carousel-5.jpg"
  },
  {
    id: "cookie-chips-chocolate",
    nombre: "Cookie chips de chocolate",
    descripcion: "Galleta clásica estilo New York con abundantes chips de chocolate.",
    precio: 3500,
    categoria: "Cookies",
    imagen: ""
  },
  {
    id: "cookie-red-velvet",
    nombre: "Cookie Red Velvet",
    descripcion: "Cookie roja aterciopelada con centro de chocolate blanco.",
    precio: 3800,
    categoria: "Cookies",
    imagen: ""
  },
  {
    id: "alfajor-clasico-maicena",
    nombre: "Alfajor clasico de maicena",
    descripcion: "Alfajor artesanal con dulce de leche y coco. Precio base según catálogo.",
    precio: 3000,
    categoria: "Alfajores",
    imagen: "/images/alfajor-maicena.jpeg"
  },
  {
    id: "alfajor-cacao-nuez",
    nombre: "Alfajor de cacao y nuez",
    descripcion: "Alfajor artesanal con cacao, nuez y dulce de leche.",
    precio: 3900,
    categoria: "Alfajores",
    imagen: "/images/alfajor-chocolate-nuez.jpeg"
  },
  {
    id: "alfacookies",
    nombre: "Alfacookies",
    descripcion: "Alfajor estilo cookie, disponible según producción del día.",
    precio: 3900,
    categoria: "Alfajores",
    imagen: ""
  },
  {
    id: "alfajor-banado-chocolate",
    nombre: "Alfajor banado en chocolate",
    descripcion: "Alfajor banado, elaborado de manera artesanal.",
    precio: 4900,
    categoria: "Alfajores",
    imagen: ""
  },
  {
    id: "alfajor-dulce-frutos-rojos",
    nombre: "Alfajor dulce de leche y frutos rojos",
    descripcion: "Relleno de dulce de leche con frutos rojos.",
    precio: 4900,
    categoria: "Alfajores",
    imagen: ""
  },
  {
    id: "budin-limon-glase",
    nombre: "Budin limon y glase",
    descripcion: "Budin artesanal. Rinde hasta 12 porciones finas.",
    precio: 8500,
    categoria: "Budines",
    imagen: ""
  },
  {
    id: "budin-naranja-mandarina-glase",
    nombre: "Budin naranja o mandarina y glase",
    descripcion: "Budin artesanal con citricos y glase.",
    precio: 8500,
    categoria: "Budines",
    imagen: ""
  },
  {
    id: "budin-zanahoria-nuez",
    nombre: "Budin zanahoria y nuez",
    descripcion: "Con ganache de canela. Precio dentro del rango del catalogo.",
    precio: 12900,
    categoria: "Budines",
    imagen: ""
  },
  {
    id: "budin-chocolate-dulce-leche",
    nombre: "Budin chocolate y dulce de leche",
    descripcion: "Budin humedo con dulce de leche.",
    precio: 12900,
    categoria: "Budines",
    imagen: ""
  },
  {
    id: "budin-marmolado",
    nombre: "Budin marmolado chocolate y vainilla",
    descripcion: "Budin marmolado artesanal.",
    precio: 9900,
    categoria: "Budines",
    imagen: ""
  },
  {
    id: "budin-vainilla-frutos-rojos",
    nombre: "Budin vainilla y frutos rojos",
    descripcion: "Budin suave con frutos rojos.",
    precio: 12900,
    categoria: "Budines",
    imagen: ""
  },
  {
    id: "budin-ingles-navideno",
    nombre: "Budin ingles navideno",
    descripcion: "Disponible en epoca navidena.",
    precio: 12900,
    categoria: "Budines",
    imagen: ""
  },
  {
    id: "lingote-chocotorta",
    nombre: "Lingote chocotorta",
    descripcion: "Postre individual. Rinde hasta 4 mini porciones.",
    precio: 14500,
    categoria: "Lingotes",
    imagen: ""
  },
  {
    id: "lingote-cheesecake-frutos-rojos",
    nombre: "Lingote cheesecake de frutos rojos",
    descripcion: "Postre individual. Rinde hasta 4 mini porciones.",
    precio: 14500,
    categoria: "Lingotes",
    imagen: ""
  },
  {
    id: "lingote-tiramisu",
    nombre: "Lingote tiramisu",
    descripcion: "Postre individual. Rinde hasta 4 mini porciones.",
    precio: 14500,
    categoria: "Lingotes",
    imagen: ""
  },
  {
    id: "lingote-rogel",
    nombre: "Lingote rogel",
    descripcion: "Postre individual. Rinde hasta 4 mini porciones.",
    precio: 14500,
    categoria: "Lingotes",
    imagen: ""
  },
  {
    id: "lingote-brownie-rama",
    nombre: "Lingote brownie con chocolate en rama",
    descripcion: "Postre individual. Rinde hasta 4 mini porciones.",
    precio: 14500,
    categoria: "Lingotes",
    imagen: ""
  },
  {
    id: "lingote-brownie-frutos-rojos",
    nombre: "Lingote brownie con frutos rojos",
    descripcion: "Postre individual. Rinde hasta 4 mini porciones.",
    precio: 14500,
    categoria: "Lingotes",
    imagen: ""
  },
  {
    id: "lingote-doble-oreo",
    nombre: "Lingote doble Oreo",
    descripcion: "Postre individual. Rinde hasta 4 mini porciones.",
    precio: 14500,
    categoria: "Lingotes",
    imagen: ""
  },
  {
    id: "lingote-torta-bruce",
    nombre: "Lingote torta Bruce",
    descripcion: "Postre individual. Rinde hasta 4 mini porciones.",
    precio: 14500,
    categoria: "Lingotes",
    imagen: ""
  },
  {
    id: "mini-tarta-crumble-manzana",
    nombre: "Mini tarta crumble de manzana",
    descripcion: "Mini tarta artesanal. Rinde hasta 4 mini porciones.",
    precio: 11500,
    categoria: "Mini tartas",
    imagen: ""
  },
  {
    id: "mini-tarta-frutal-dulce-crema",
    nombre: "Mini tarta frutal con dulce de leche y crema",
    descripcion: "Mini tarta artesanal con frutas.",
    precio: 11500,
    categoria: "Mini tartas",
    imagen: ""
  },
  {
    id: "mini-tarta-cabsha-nuez",
    nombre: "Mini tarta cabsha con nuez",
    descripcion: "Base de chocolate y nuez, dulce de leche y ganache.",
    precio: 11500,
    categoria: "Mini tartas",
    imagen: ""
  },
  {
    id: "mini-tarta-key-lime-pie",
    nombre: "Mini tarta key lime pie",
    descripcion: "Mini tarta de lima, suave y fresca.",
    precio: 11500,
    categoria: "Mini tartas",
    imagen: ""
  },
  {
    id: "mini-tarta-lemon-pie",
    nombre: "Mini tarta lemon pie",
    descripcion: "Mini tarta de limon y merengue.",
    precio: 11500,
    categoria: "Mini tartas",
    imagen: ""
  },
  {
    id: "mini-tarta-ipanema",
    nombre: "Mini tarta Ipanema",
    descripcion: "Coco y limon.",
    precio: 11500,
    categoria: "Mini tartas",
    imagen: ""
  },
  {
    id: "mini-tarta-ricota",
    nombre: "Mini tarta de ricota",
    descripcion: "Mini tarta artesanal de ricota.",
    precio: 11500,
    categoria: "Mini tartas",
    imagen: ""
  },
  {
    id: "medialunas",
    nombre: "Medialunas",
    descripcion: "Unidad.",
    precio: 750,
    categoria: "Otros dulces",
    imagen: ""
  },
  {
    id: "pastelitos",
    nombre: "Pastelitos",
    descripcion: "Unidad.",
    precio: 2000,
    categoria: "Otros dulces",
    imagen: ""
  },
  {
    id: "pastafrolitas-individuales",
    nombre: "Pastafrolitas individuales",
    descripcion: "Porcion individual.",
    precio: 3900,
    categoria: "Otros dulces",
    imagen: ""
  },
  {
    id: "tartita-coco",
    nombre: "Tartita de coco",
    descripcion: "Tartita individual.",
    precio: 6500,
    categoria: "Otros dulces",
    imagen: ""
  },
  {
    id: "alfajorcitos-mini-maicena-x12",
    nombre: "Alfajorcitos mini de maicena x12",
    descripcion: "Docena de alfajorcitos mini.",
    precio: 7500,
    categoria: "Otros dulces",
    imagen: ""
  },
  {
    id: "donas-rellenas",
    nombre: "Donas rellenas",
    descripcion: "Unidad.",
    precio: 1800,
    categoria: "Otros dulces",
    imagen: ""
  },
  {
    id: "conitos-dulce-leche",
    nombre: "Conitos de dulce de leche",
    descripcion: "Unidad.",
    precio: 1300,
    categoria: "Otros dulces",
    imagen: ""
  },
  {
    id: "cuadrado-brownie",
    nombre: "Cuadrado de brownie",
    descripcion: "Porcion individual.",
    precio: 4900,
    categoria: "Otros dulces",
    imagen: ""
  },
  {
    id: "cuadrado-budin-limon-marmolado-frutos",
    nombre: "Cuadrado de budin",
    descripcion: "Sabores: limon, marmolado o frutos rojos.",
    precio: 4500,
    categoria: "Otros dulces",
    imagen: ""
  },
  {
    id: "pepas",
    nombre: "Pepas",
    descripcion: "Porción según disponibilidad.",
    precio: 3900,
    categoria: "Otros dulces",
    imagen: ""
  },
  {
    id: "ensalada-dia",
    nombre: "Ensalada del dia",
    descripcion: "Incluye pollo, atun, jamon crudo o jamon cocido.",
    precio: 12800,
    categoria: "Salado",
    imagen: ""
  },
  {
    id: "ensalada-cesar",
    nombre: "Ensalada Cesar",
    descripcion: "Lechuga, queso sardo, pollo salteado, palta y aderezo cesar casero.",
    precio: 12800,
    categoria: "Salado",
    imagen: ""
  },
  {
    id: "tarta-casera",
    nombre: "Tarta casera",
    descripcion: "Opciones: caprese, jamón y queso, mix de verduras o pollo.",
    precio: 9800,
    categoria: "Salado",
    imagen: ""
  },
  {
    id: "sandwich-miga-unidad",
    nombre: "Sandwich de miga",
    descripcion: "Consultar stock del dia.",
    precio: 1500,
    categoria: "Salado",
    imagen: ""
  },
  {
    id: "sandwich-miga-x6",
    nombre: "Sandwiches de miga x6",
    descripcion: "Consultar stock del dia.",
    precio: 8900,
    categoria: "Salado",
    imagen: ""
  },
  {
    id: "sandwich-miga-x12",
    nombre: "Sandwiches de miga x12",
    descripcion: "Consultar stock del dia.",
    precio: 17500,
    categoria: "Salado",
    imagen: ""
  },
  {
    id: "scones-queso",
    nombre: "Scones de queso",
    descripcion: "Ideales para armar sandwich.",
    precio: 2900,
    categoria: "Salado",
    imagen: ""
  },
  {
    id: "bandeja-matera-chica",
    nombre: "Bandeja matera chica",
    descripcion: "12 porciones. Incluye cuadraditos o porciones dulces según stock.",
    precio: 13900,
    categoria: "Bandejas",
    imagen: ""
  },
  {
    id: "bandeja-matera-mediana",
    nombre: "Bandeja matera mediana",
    descripcion: "24 porciones. Ideal para reuniones.",
    precio: 26900,
    categoria: "Bandejas",
    imagen: ""
  },
  {
    id: "bandeja-matera-grande",
    nombre: "Bandeja matera grande",
    descripcion: "42 porciones. Rendidoras para eventos o juntadas.",
    precio: 47900,
    categoria: "Bandejas",
    imagen: ""
  },
  {
    id: "brownie-clasico",
    nombre: "Brownie clasico",
    descripcion: "Dulce de leche y merengue.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "brownie-flor-postre",
    nombre: "Brownie Flor de Postre",
    descripcion: "Dulce, crema y chocolate en rama o frutos rojos.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "chocotorta-clasica",
    nombre: "Chocotorta clasica",
    descripcion: "Postre clasico de Flor de Postre.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "chocotorta-golosinas",
    nombre: "Chocotorta con golosinas",
    descripcion: "Chocotorta decorada con golosinas.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "cheesecake-frutos-rojos",
    nombre: "Cheesecake de frutos rojos",
    descripcion: "Postre de cheesecake con frutos rojos.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "crumble-manzana-nuez",
    nombre: "Crumble de manzana con nuez",
    descripcion: "Postre artesanal de manzana y nuez.",
    precio: 11500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "lemon-pie",
    nombre: "Lemon pie",
    descripcion: "Postre de limon y merengue.",
    precio: 11500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "key-lime-pie",
    nombre: "Key lime pie",
    descripcion: "Postre fresco de lima.",
    precio: 11500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "ipanema",
    nombre: "Ipanema",
    descripcion: "Base de coco, crema de limon, leche condensada y crema con coco.",
    precio: 11500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "doble-oreo",
    nombre: "Doble Oreo",
    descripcion: "Postre de Oreo.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "tarta-cabsha-postre",
    nombre: "Tarta Cabsha",
    descripcion: "Base de choco y nuez, dulce de leche y ganache de chocolate.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "tarta-coco",
    nombre: "Tarta de coco",
    descripcion: "Tarta dulce de coco.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "tarta-ricota",
    nombre: "Tarta de ricota",
    descripcion: "Clasica, con dulce de leche o membrillo.",
    precio: 11500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "tarta-frutas-estacion",
    nombre: "Tarta de frutas de estacion",
    descripcion: "Con crema pastelera o dulce y chantilli.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "rogel-12-capas",
    nombre: "Rogel de 12 capas",
    descripcion: "Rogel artesanal.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "tiramisu",
    nombre: "Tiramisu",
    descripcion: "Postre clasico.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "pavlova",
    nombre: "Pavlova",
    descripcion: "Postre con merengue y frutas.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "flan-dulce-leche-crema",
    nombre: "Flan con dulce de leche y crema",
    descripcion: "Flan casero.",
    precio: 14500,
    categoria: "Postres",
    imagen: ""
  },
  {
    id: "torta-merengue-18",
    nombre: "Torta con merengue italiano 18 cm",
    descripcion: "2 rellenos. Rinde hasta 12 porciones. Pedir con 2 dias de anticipacion.",
    precio: 36900,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-merengue-22",
    nombre: "Torta con merengue italiano 22 cm",
    descripcion: "2 rellenos. Rinde hasta 22 porciones. Pedir con 2 dias de anticipacion.",
    precio: 44900,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-merengue-24",
    nombre: "Torta con merengue italiano 24 cm",
    descripcion: "2 rellenos. Rinde hasta 35 porciones. Pedir con 2 dias de anticipacion.",
    precio: 51900,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-buttercream-18-2",
    nombre: "Torta buttercream 18 cm, 2 rellenos",
    descripcion: "Rinde hasta 15 porciones. Pedir con 5 dias de anticipacion.",
    precio: 55900,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-buttercream-22-2",
    nombre: "Torta buttercream 22 cm, 2 rellenos",
    descripcion: "Rinde hasta 25 porciones. Pedir con 5 dias de anticipacion.",
    precio: 62850,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-buttercream-24-2",
    nombre: "Torta buttercream 24 cm, 2 rellenos",
    descripcion: "Rinde hasta 35 porciones. Pedir con 5 dias de anticipacion.",
    precio: 75620,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-buttercream-18-3",
    nombre: "Torta buttercream 18 cm, 3 rellenos",
    descripcion: "Rinde hasta 25 porciones. Pedir con 5 dias de anticipacion.",
    precio: 62100,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-buttercream-22-3",
    nombre: "Torta buttercream 22 cm, 3 rellenos",
    descripcion: "Rinde hasta 35 porciones. Pedir con 5 dias de anticipacion.",
    precio: 69690,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-buttercream-24-3",
    nombre: "Torta buttercream 24 cm, 3 rellenos",
    descripcion: "Rinde hasta 50 porciones. Pedir con 5 dias de anticipacion.",
    precio: 85620,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-fondant-18-2",
    nombre: "Torta fondant 18 cm, 2 rellenos",
    descripcion: "Rinde hasta 18 porciones. Pedir con 5 dias de anticipacion.",
    precio: 65680,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-fondant-22-2",
    nombre: "Torta fondant 22 cm, 2 rellenos",
    descripcion: "Rinde hasta 25 porciones. Pedir con 5 dias de anticipacion.",
    precio: 79680,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-fondant-24-2",
    nombre: "Torta fondant 24 cm, 2 rellenos",
    descripcion: "Rinde hasta 35/40 porciones. Pedir con 5 dias de anticipacion.",
    precio: 90440,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-fondant-18-3",
    nombre: "Torta fondant 18 cm, 3 rellenos",
    descripcion: "Rinde hasta 25 porciones. Pedir con 5 dias de anticipacion.",
    precio: 75280,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-fondant-22-3",
    nombre: "Torta fondant 22 cm, 3 rellenos",
    descripcion: "Rinde hasta 35 porciones. Pedir con 5 dias de anticipacion.",
    precio: 85360,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "torta-fondant-24-3",
    nombre: "Torta fondant 24 cm, 3 rellenos",
    descripcion: "Rinde hasta 50 porciones. Pedir con 5 dias de anticipacion.",
    precio: 98600,
    categoria: "Tortas",
    imagen: ""
  },
  {
    id: "extra-frutos-rojos",
    nombre: "Extra frutos rojos",
    descripcion: "Agregado extra para tortas.",
    precio: 2000,
    categoria: "Extras",
    imagen: ""
  },
  {
    id: "extra-nutella",
    nombre: "Extra Nutella",
    descripcion: "Agregado extra para tortas.",
    precio: 5000,
    categoria: "Extras",
    imagen: ""
  },
  {
    id: "extra-kinder-ferrero",
    nombre: "Extra Kinder o Ferrero",
    descripcion: "Agregado extra para tortas.",
    precio: 4500,
    categoria: "Extras",
    imagen: ""
  },
  {
    id: "extra-frutos-secos-nueces",
    nombre: "Extra frutos secos o nueces",
    descripcion: "Agregado extra para tortas.",
    precio: 2000,
    categoria: "Extras",
    imagen: ""
  },
  {
    id: "extra-pisos-falsos",
    nombre: "Pisos falsos",
    descripcion: "Adicional para tortas fondant: +25% del valor.",
    precio: 10000,
    categoria: "Extras",
    imagen: ""
  },
  {
    id: "extra-corazon",
    nombre: "Torta en forma de corazon",
    descripcion: "Adicional para tortas especiales.",
    precio: 10000,
    categoria: "Extras",
    imagen: ""
  },
  {
    id: "extra-imprimible",
    nombre: "Imprimible para torta",
    descripcion: "Impresion en papel ilustracion con palito transparente o pasta ballina.",
    precio: 3000,
    categoria: "Extras",
    imagen: ""
  },
  {
    id: "extra-topper-acrilico-nombre-numero",
    nombre: "Topper acrilico nombre o numero",
    descripcion: "Decoracion extra.",
    precio: 2500,
    categoria: "Extras",
    imagen: ""
  },
  {
    id: "extra-topper-acrilico-frase",
    nombre: "Topper acrilico con frase",
    descripcion: "Decoracion extra.",
    precio: 3500,
    categoria: "Extras",
    imagen: ""
  },
  {
    id: "extra-mono-bebe",
    nombre: "Mono con cinta de bebe",
    descripcion: "Decoracion extra.",
    precio: 2500,
    categoria: "Extras",
    imagen: ""
  },
  {
    id: "extra-porcelana-fria",
    nombre: "Adorno de porcelana fria",
    descripcion: "A partir del precio indicado.",
    precio: 5000,
    categoria: "Extras",
    imagen: ""
  },
  {
    id: "extra-flores",
    nombre: "Flores naturales o de tela",
    descripcion: "A partir del precio indicado.",
    precio: 12000,
    categoria: "Extras",
    imagen: ""
  }
];
