// Contenido oficial tomado de "Reglamento Encuentro robotica y Dron Inedsor 2026.pdf" (emitido el 24 de septiembre de 2026).
// Mantener sincronizado con ese documento; no agregar horarios ni reglas que no estén en él.

export const REGULATION_PDF = "/reglamento-inedsor-2026.pdf"

export const EVENT = {
  name: "Competencia de Robótica",
  institution: "Institución Educativa Soledad Román de Núñez",
  dateLabel: "29 de septiembre de 2026",
  date: new Date("2026-09-29T00:00:00-05:00"),
  director: "Edil Melo",
  issued: "24 de septiembre de 2026",
}

export const DAY_PLAN = [
  "Recepción y registro",
  "Bienvenida, saludos de la comunidad educativa e himnos",
  "Anuncio de brackets y categorías en paralelo",
  "Competencias por categoría",
  "Finales y premiación",
]

export const ESSENTIALS = [
  { title: "Sorteo por software", text: "El orden de turnos se escoge al azar y es visible para todos en todo momento." },
  { title: "Brackets visibles", text: "Nombres de robots, número de competidores y resultados, siempre actualizados." },
  { title: "Categorías en paralelo", text: "Algunas se realizarán al mismo tiempo; se avisa tras la bienvenida." },
  { title: "Sala técnica", text: "Habilitada para soluciones que requieran los robots." },
]

export const ORGANIZATION = [
  { role: "Director del evento", text: "Edil Melo" },
  { role: "Administración y docentes", text: "Coordinación general y logística." },
  { role: "Estudiantes de apoyo", text: "Recibimiento, atención y preguntas." },
  { role: "Árbitros y jueces", text: "Control de reglas y decisiones en cada categoría." },
  { role: "Mesa de brackets", text: "Sorteos, llaves y resultados en pantalla." },
  { role: "Sala técnica", text: "Ajustes y soluciones para los robots." },
]

export const GENERAL_RULES = [
  {
    title: "Brackets y modalidad",
    items: [
      "Los brackets, enfrentamientos y la modalidad de juego se definen a partir de la demanda (inscritos).",
      "Se avisan antes de iniciar la competencia y son inmutables: así se garantiza el número correcto de competidores.",
      "El orden se sortea al azar con software. Llaves, nombres de robots y número de competidores son visibles para todos en todo momento.",
    ],
  },
  {
    title: "Categorías en paralelo",
    items: [
      "Algunas categorías se realizarán al mismo tiempo que otras (por ejemplo, Circuito de Dron con Seguidor de Línea o Minisumo).",
      "Se anunciará después de la bienvenida, los saludos de la comunidad educativa y los himnos.",
    ],
  },
  {
    title: "Medidas y peso",
    items: [
      "Se aplica un margen de tolerancia, sobre todo por las llantas: hasta +5 mm en medidas y +2 % en peso.",
      "Aun así, el robot debe mantener total legalidad de tamaño y peso, dentro de ese margen, durante toda la competencia.",
      "Fuera del margen: 5 min para ajustar; si no cumple, no compite.",
    ],
  },
  {
    title: "Seguridad",
    items: [
      "Sin objetos afilados, cortantes o punzantes, ni líquidos, llamas, pegantes o sustancias en ruedas o pista.",
      "Solo baterías recargables. Único punzón permitido: el de ExplotaGlobos (solo para globos).",
      "Sin imanes ni succión para fijar el robot al piso.",
    ],
  },
  {
    title: "Sala técnica",
    items: [
      "Espacio habilitado para soluciones técnicas que requiera el robot: mesas, energía y herramientas básicas.",
      "Se usa fuera de los combates. Al ser llamado, el equipo debe estar listo: tras 2 llamados, pierde el turno.",
    ],
  },
  {
    title: "Radiocontrol",
    items: [
      "1 piloto por robot. Se permite 2,4 GHz o Bluetooth; también 27 MHz y 40 MHz en los canales autorizados.",
      "Cada equipo informa su frecuencia al árbitro. Los transmisores no se encienden fuera de la zona de control.",
    ],
  },
  {
    title: "Equipos y arbitraje",
    items: [
      "Máx. 2 integrantes por robot en la zona de competencia.",
      "La decisión del árbitro es final. Sanciones: llamado de atención → advertencia → penalización o descalificación.",
      "Se exige respeto entre equipos, jueces y público. Los estudiantes de apoyo atienden dudas y orientan a los participantes.",
    ],
  },
]

type Spec = { label: string; value: string }
type Detail = { label: string; text: string }

export type CategoryRegulation = {
  number: number
  officialName: string
  kind: "Autónomo" | "Radiocontrol" | "Dron"
  modality: string
  headerTag: string
  summary: string
  highlights: Spec[]
  robot: Detail[]
  field: { title: string; items: Detail[] }
  howToPlay: string[]
  fouls: string[]
  page: number
}

const RC_MOTORS = "DC con caja reductora amarilla estándar. Cantidad libre."
const RC_CONTROL = "1 piloto por robot. RC 2,4 GHz o Bluetooth. Sin sensores ni autonomía."
const OUT_OF_SPEC = "Medidas o peso fuera de norma: 5 min para ajustar; si no, queda descalificado."
const SUMO_ROUNDS = [
  "Gana el round: saca al rival del dojo o el rival queda inmóvil 10 s.",
  "Si quedan trabados sin avanzar 10 s, el árbitro los reinicia en otra posición (máx. 2 veces por round).",
  "Combate al mejor de 3 rounds, de máx. 3 min cada uno. Sin ganador: decide el árbitro por iniciativa de ataque.",
]

export const REGULATIONS: Record<string, CategoryRegulation> = {
  minisumo: {
    number: 1,
    officialName: "Minisumo Autónomo",
    kind: "Autónomo",
    modality: "1 vs 1 · mejor de 3",
    headerTag: "Autónomo · 1 vs 1",
    summary: "Dos robots autónomos se enfrentan en el dojo. Gana quien saque al rival del área de combate.",
    highlights: [
      { label: "Control", value: "Autónomo" },
      { label: "Medidas", value: "10 × 10 cm" },
      { label: "Peso máx.", value: "500 g" },
      { label: "Combate", value: "Mejor de 3" },
    ],
    robot: [
      { label: "Medidas", text: "Base máx. 10 × 10 cm. Altura libre. No puede ampliar su tamaño durante el combate." },
      { label: "Peso", text: "Máx. 500 g." },
      { label: "Motores", text: "Minisumo, amarillos o azules." },
      { label: "Control", text: "100 % autónomo. Sin control remoto. Solo baterías recargables." },
      { label: "Sensores y placas", text: "Infrarrojos, ultrasónicos, giroscopio, etc. Placas programables permitidas." },
      { label: "Chasis", text: "Impresión 3D, acrílico, plástico, MDF o metal ligero. Sin bordes filosos." },
    ],
    field: {
      title: "Dojo",
      items: [
        { label: "Forma y tamaño", text: "Círculo de 77 cm de diámetro, superficie negra mate." },
        { label: "Línea límite", text: "Borde blanco de 2,5 cm sobre el dojo negro. Pierde quien toque fuera del dojo." },
      ],
    },
    howToPlay: [
      "Cada robot se ubica en su lado, sin tocar la línea blanca.",
      "Cuenta de 5 s con los robots quietos. Después, nadie puede tocar el robot.",
      ...SUMO_ROUNDS,
    ],
    fouls: [
      "Moverse antes de los 5 s: 1 advertencia; si se repite, pierde el round.",
      "Tocar o intervenir el robot tras el inicio: pierde el round.",
      OUT_OF_SPEC,
      "Armas, líquidos, pegantes, succión o imanes, o interferir la electrónica rival: descalificación.",
    ],
    page: 3,
  },
  sumo: {
    number: 2,
    officialName: "Sumo Autónomo",
    kind: "Autónomo",
    modality: "1 vs 1 · mejor de 3",
    headerTag: "Autónomo · 1 vs 1",
    summary: "Robots autónomos de mayor tamaño se enfrentan en el dojo. Gana quien saque al rival del área.",
    highlights: [
      { label: "Control", value: "Autónomo" },
      { label: "Medidas", value: "20 × 20 cm" },
      { label: "Peso máx.", value: "1,5 kg" },
      { label: "Combate", value: "Mejor de 3" },
    ],
    robot: [
      { label: "Medidas", text: "Base máx. 20 × 20 cm. Altura libre. Puede desplegar mecanismos después de los 5 s." },
      { label: "Peso", text: "Máx. 1,5 kg." },
      { label: "Motores y ruedas", text: "Motores DC libres. Ruedas de goma o antideslizantes." },
      { label: "Control", text: "100 % autónomo. Sin control remoto. Solo baterías recargables." },
      { label: "Estructura", text: "Se permiten palas, cuñas o levantadores que no dañen el dojo ni al rival." },
      { label: "Prohibido", text: "Sierras, lanzas, llamas, proyectiles, succión, imanes o bordes filosos." },
    ],
    field: {
      title: "Dojo",
      items: [
        { label: "Forma y tamaño", text: "Círculo de 154 cm de diámetro, superficie negra antideslizante." },
        { label: "Línea límite", text: "Borde blanco de 5 cm sobre el dojo negro. Pierde quien toque fuera del dojo." },
      ],
    },
    howToPlay: [
      "Robots a 10 cm o más de separación, cada uno en su lado. Máx. 2 integrantes por equipo.",
      "Cuenta de 5 s con los robots quietos. Después, nadie puede tocar el robot.",
      ...SUMO_ROUNDS,
    ],
    fouls: [
      "Moverse antes de los 5 s: 1 advertencia; si se repite, pierde el round.",
      "Robot que no funciona o no se mueve en los primeros 10 s: pierde el round.",
      OUT_OF_SPEC,
      "Intervenir el robot en combate o dañar el dojo: descalificación.",
    ],
    page: 4,
  },
  "sumo-rc": {
    number: 3,
    officialName: "Sumo RC",
    kind: "Radiocontrol",
    modality: "1 vs 1 · mejor de 3",
    headerTag: "Radiocontrol · 1 vs 1",
    summary: "Robots radiocontrolados se enfrentan en el dojo. Gana quien saque al rival del área de combate.",
    highlights: [
      { label: "Control", value: "Radiocontrol" },
      { label: "Medidas", value: "20 × 20 cm" },
      { label: "Peso máx.", value: "1 kg" },
      { label: "Combate", value: "Mejor de 3" },
    ],
    robot: [
      { label: "Medidas", text: "Base máx. 20 × 20 cm. Altura libre. No puede desplegarse ni exceder la medida." },
      { label: "Peso", text: "Máx. 1 kg." },
      { label: "Motores", text: RC_MOTORS },
      { label: "Control", text: RC_CONTROL },
      { label: "Energía", text: "Solo baterías recargables." },
      { label: "Estructura", text: "Cuña o pala permitidas. Sin objetos filosos ni imanes o succión." },
    ],
    field: {
      title: "Dojo",
      items: [
        { label: "Forma y tamaño", text: "Círculo de 154 cm de diámetro, superficie negra antideslizante." },
        { label: "Línea límite", text: "Borde blanco de 5 cm. Pilotos fuera del dojo, en su zona marcada." },
      ],
    },
    howToPlay: [
      "Cada robot en su lado, sin tocar la línea blanca. Los pilotos no entran al dojo.",
      "Cuenta de 5 s con los robots quietos. Después, nadie puede tocar el robot.",
      "Gana el round: saca al rival del dojo, el rival queda inmóvil 10 s o pierde señal / se apaga.",
      SUMO_ROUNDS[1],
      SUMO_ROUNDS[2],
    ],
    fouls: [
      "Moverse antes de los 5 s: 1 advertencia; si se repite, pierde el round.",
      "Tocar el robot o entrar al dojo durante el round: pierde el round.",
      OUT_OF_SPEC,
      "Dañar el dojo o al rival a propósito, o usar sensores: descalificación.",
    ],
    page: 5,
  },
  futbolito: {
    number: 4,
    officialName: "Futbolito",
    kind: "Radiocontrol",
    modality: "Partido 2 × 3 min",
    headerTag: "Radiocontrol · Equipos",
    summary: "Robots radiocontrolados juegan fútbol con una pelota pequeña. Gana quien anote más goles.",
    highlights: [
      { label: "Control", value: "Radiocontrol" },
      { label: "Medidas", value: "20 × 20 cm" },
      { label: "Peso máx.", value: "1 kg" },
      { label: "Partido", value: "2 × 3 min" },
    ],
    robot: [
      { label: "Medidas", text: "Base máx. 20 × 20 cm. Altura libre. No puede desplegarse ni exceder la medida." },
      { label: "Peso", text: "Máx. 1 kg." },
      { label: "Motores", text: RC_MOTORS },
      { label: "Control", text: RC_CONTROL },
      { label: "Estructura", text: "Puede empujar y conducir la pelota; no puede atraparla ni sostenerla. Sin filos." },
    ],
    field: {
      title: "Cancha",
      items: [
        { label: "Campo", text: "2 × 1,5 m con bordes y dos arcos de 40 cm." },
        { label: "Pelota", text: "Pelota de ping-pong (tenis de mesa)." },
      ],
    },
    howToPlay: [
      "Partido de 2 tiempos de 3 min con 1 min de descanso. Modalidad 1 vs 1 o por equipos, según inscritos.",
      "Inicio y reinicio tras gol en el centro, con el silbato del árbitro. Al silbato, todos se detienen.",
      "Si un robot se apaga, debe retirarse del campo hasta que el árbitro indique que puede volver.",
      "No se puede retener la pelota más de 3 s ni dejar el robot inmóvil bloqueando el arco.",
      "Cada equipo tiene 1 tiempo técnico de 1 min por partido.",
      "Empate: gol de oro (máx. 2 min). Si sigue, 3 penales por equipo.",
    ],
    fouls: [
      "Cada falta recibe 1 advertencia; la reincidencia: robot fuera 30 s.",
      "Volcar o dañar al rival a propósito: descalificación del partido.",
      "Pilotos no pueden tocar la cancha; solo el árbitro reubica robots y pelota.",
      OUT_OF_SPEC,
    ],
    page: 6,
  },
  "seguidor-de-linea": {
    number: 5,
    officialName: "Seguidor de Línea",
    kind: "Autónomo",
    modality: "Contrarreloj · 2 intentos",
    headerTag: "Autónomo · Contrarreloj",
    summary: "Recorrer la pista siguiendo la línea negra en el menor tiempo posible.",
    highlights: [
      { label: "Control", value: "Autónomo" },
      { label: "Medidas", value: "20 × 20 cm" },
      { label: "Peso máx.", value: "1 kg" },
      { label: "Intentos", value: "2 (mejor tiempo)" },
    ],
    robot: [
      { label: "Tipo de robot", text: "Libre: preprogramados, micro:bit, LEGO Education, Arduino y similares." },
      { label: "Control", text: "100 % autónomo. Sin control remoto." },
      { label: "Medidas", text: "Máx. 20 × 20 cm. Altura libre." },
      { label: "Peso", text: "Máx. 1 kg." },
      { label: "Sensores y motores", text: "Libres. Los kits usan su propia batería. Sin bordes filosos." },
      { label: "Grupos", text: "Según inscritos pueden crearse grupos (kits educativos / construidos a medida). Se avisa antes de iniciar." },
    ],
    field: {
      title: "Pista",
      items: [
        { label: "Trazado", text: "Línea negra de 2 cm sobre superficie blanca, con curvas y cambios de dirección." },
        { label: "Marcas", text: "Punto de salida, meta y puntos de control para medir el avance." },
      ],
    },
    howToPlay: [
      "2 intentos por robot; cuenta el mejor tiempo. Tiempo máx. 2 min por intento.",
      "1 min de calibración antes de cada intento, con el robot en la salida.",
      "El reloj corre desde la señal de salida hasta que el frente del robot cruza la meta.",
      "Si se sale de la línea, se reposiciona en el último punto sobre la línea con +5 s (máx. 3 veces).",
      "Si no llega a la meta, se clasifica por el punto de control más lejano alcanzado.",
      "Tocar el robot durante el recorrido solo se permite con autorización del árbitro.",
    ],
    fouls: [
      "Cortar camino o saltarse un tramo: intento anulado.",
      "Control remoto o ayuda externa durante el recorrido: intento anulado.",
      "Dañar la pista o usar pegantes o sustancias en las ruedas: descalificación.",
    ],
    page: 7,
  },
  "laberinto-rc": {
    number: 6,
    officialName: "Laberinto RC",
    kind: "Radiocontrol",
    modality: "Contrarreloj · 2 intentos",
    headerTag: "Radiocontrol · Contrarreloj",
    summary: "Pilotar el robot de la entrada a la salida del laberinto en el menor tiempo. El laberinto no cambia para ningún competidor.",
    highlights: [
      { label: "Control", value: "Radiocontrol" },
      { label: "Medidas", value: "20 × 20 cm" },
      { label: "Peso máx.", value: "1 kg" },
      { label: "Intentos", value: "2 (mejor tiempo)" },
    ],
    robot: [
      { label: "Medidas", text: "Base máx. 20 × 20 cm. Altura libre. No puede desplegarse." },
      { label: "Peso", text: "Máx. 1 kg." },
      { label: "Motores", text: RC_MOTORS },
      { label: "Control", text: RC_CONTROL },
      { label: "Seguridad", text: "Sin objetos filosos. No debe dañar las paredes." },
    ],
    field: {
      title: "Laberinto",
      items: [
        { label: "Diseño", text: "Recorrido fijo, con pasillos de 30 cm y paredes de 10 cm." },
        { label: "Marcas", text: "Entrada, salida y puntos de control claramente señalados." },
      ],
    },
    howToPlay: [
      "Equidad: el orden de turnos se sortea y los competidores en espera permanecen fuera de vista. Nadie puede ver el intento de otro.",
      "2 intentos por piloto; cuenta el mejor tiempo. Tiempo máx. 3 min por intento.",
      "El reloj corre desde la señal de salida hasta que el frente del robot cruza la meta.",
      "Robot volcado o atascado: el árbitro lo reubica en ese punto con +10 s.",
      "Si no llega a la meta, se clasifica por el punto de control más lejano alcanzado.",
    ],
    fouls: [
      "Mover o derribar paredes: +5 s por cada vez.",
      "Tocar el robot sin autorización del árbitro: intento anulado.",
      "Recibir indicaciones de quien ya recorrió el laberinto: descalificación.",
      OUT_OF_SPEC,
    ],
    page: 8,
  },
  "circuito-dron": {
    number: 7,
    officialName: "Circuito de Dron",
    kind: "Dron",
    modality: "Individual · 3 min por piloto",
    headerTag: "Dron · Individual",
    summary: "Cada piloto vuela solo el circuito. Gana quien lo complete más rápido dentro del tiempo límite.",
    highlights: [
      { label: "Control", value: "Manual (piloto)" },
      { label: "Peso máx.", value: "250 g" },
      { label: "Tiempo", value: "3 min por piloto" },
      { label: "Hélices", value: "Protegidas" },
    ],
    robot: [
      { label: "Dron", text: "Peso máx. 250 g. Protectores de hélices obligatorios." },
      { label: "Control", text: "Vuelo manual a la vista. Se permite estabilización (mantener altura). Sin rutas automáticas." },
      { label: "Baterías", text: "Del propio dron, en buen estado y sin hinchazón." },
      { label: "Equipo", text: "Cada piloto trae su dron, control y baterías de repuesto." },
    ],
    field: {
      title: "Circuito",
      items: [
        { label: "Recorrido", text: "Puertas o aros numerados, en orden, con zona de despegue y aterrizaje." },
        { label: "Área de vuelo", text: "Delimitada con red o cinta, con zona de seguridad frente al público." },
      ],
    },
    howToPlay: [
      "Orden por sorteo. Vuela un piloto a la vez.",
      "Tiempo límite: 3 min por piloto (puede ser 5 min según inscritos; se avisa antes de iniciar).",
      "2 intentos por piloto; cuenta el mejor tiempo.",
      "El reloj corre desde el despegue hasta pasar la última puerta.",
      "Gana el menor tiempo. Si nadie completa el circuito, gana quien supere más puertas.",
      "Puertas en orden. Puerta omitida: debe regresar a pasarla.",
    ],
    fouls: [
      "Tocar una puerta o aro: +5 s.",
      "Caída: puede reiniciar desde el despegue o la última puerta con el reloj corriendo (máx. 2 veces).",
      "Dron hacia el público o fuera del área: aterrizaje inmediato y termina el intento.",
      "Hélices sin protección o dron fuera de norma: no vuela.",
    ],
    page: 9,
  },
  "carrera-rc": {
    number: 8,
    officialName: "Carrera de RC's",
    kind: "Radiocontrol",
    modality: "Series · 3 vueltas",
    headerTag: "Radiocontrol · Carrera",
    summary: "Varios robots radiocontrolados compiten en la pista. Gana quien completa las 3 vueltas primero.",
    highlights: [
      { label: "Control", value: "Radiocontrol" },
      { label: "Medidas", value: "20 × 20 cm" },
      { label: "Peso máx.", value: "1 kg" },
      { label: "Carrera", value: "3 vueltas" },
    ],
    robot: [
      { label: "Medidas", text: "Base máx. 20 × 20 cm. Altura libre. No puede desplegarse." },
      { label: "Peso", text: "Máx. 1 kg." },
      { label: "Motores", text: RC_MOTORS },
      { label: "Control", text: RC_CONTROL },
      { label: "Llantas", text: "Libres, de goma o similar. Sin picos ni elementos filosos." },
    ],
    field: {
      title: "Pista",
      items: [
        { label: "Trazado", text: "Circuito cerrado con curvas y bordes, de ancho mínimo 40 cm." },
        { label: "Salida", text: "Parrilla con posiciones por sorteo. Línea de salida y meta marcadas." },
      ],
    },
    howToPlay: [
      "Se corre en series de hasta 4 robots; pasan los 2 primeros hasta la final (puede ajustarse según inscritos).",
      "Salida por señal del árbitro, con los robots quietos en la parrilla.",
      "Contacto leve permitido. Empujar o sacar a un rival a propósito: +5 s.",
      "Si un robot sale de pista o se voltea, el árbitro lo reubica donde salió.",
      "Si un robot se apaga, sale de la pista hasta que el árbitro indique; si no vuelve en 30 s, queda fuera de la serie.",
      "Los pilotos permanecen en su zona; no entran a la pista.",
    ],
    fouls: [
      "Atajos o cortar el circuito: la vuelta no cuenta.",
      "Dañar al rival a propósito: descalificación de la serie.",
      "Reincidir tras una advertencia: +5 s por cada caso.",
      OUT_OF_SPEC,
    ],
    page: 10,
  },
  explotaglobos: {
    number: 9,
    officialName: "ExplotaGlobos",
    kind: "Radiocontrol",
    modality: "Combate · 3 min",
    headerTag: "Radiocontrol · Combate",
    summary: "Robots radiocontrolados intentan explotar los globos del rival y proteger los propios.",
    highlights: [
      { label: "Control", value: "Radiocontrol" },
      { label: "Medidas", value: "20 × 20 cm" },
      { label: "Peso máx.", value: "1 kg" },
      { label: "Duración", value: "3 min" },
    ],
    robot: [
      { label: "Medidas", text: "Base máx. 20 × 20 cm. Altura libre. No puede desplegarse." },
      { label: "Peso", text: "Máx. 1 kg." },
      { label: "Motores", text: RC_MOTORS },
      { label: "Control", text: RC_CONTROL },
      { label: "Globos", text: "3 globos inflados por robot, amarrados con hilo de unos 30 cm en la parte trasera. Los globos deben tocar el suelo." },
      { label: "Punzón", text: "Único elemento punzante permitido: una punta corta de máx. 2 cm, solo para globos y con tapa fuera del combate." },
    ],
    field: {
      title: "Arena",
      items: [
        { label: "Campo", text: "Cuadrada de 2 × 2 m con bordes bajos." },
      ],
    },
    howToPlay: [
      "Gana quien tenga más globos al terminar los 3 min o deje al rival sin ellos. Empate: 1 min extra; gana quien explote primero.",
      "Al silbato del árbitro, todos los robots se detienen de inmediato.",
      "Si un robot se apaga, sale del campo hasta que el árbitro indique que puede volver.",
      "Prohibido quedarse inmóvil: llamado de atención y luego 1 advertencia por caso; si reincide, pierde un globo.",
      "Estrategias y alianzas entre colegios están permitidas. Modalidad 1 vs 1 o por equipos, según inscritos.",
    ],
    fouls: [
      "Ocultar o proteger los globos dentro de la estructura: no permitido.",
      "Usar el punzón contra el robot rival o volcarlo a propósito: descalificación.",
      "Tocar el robot sin autorización del árbitro: pierde un globo.",
      OUT_OF_SPEC,
    ],
    page: 11,
  },
}

export const regulationFor = (slug: string): CategoryRegulation | undefined => REGULATIONS[slug]
