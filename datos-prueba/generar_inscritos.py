"""Genera inscritos FICTICIOS para probar la importación, la asistencia y las llaves.

Las instituciones son colegios reales de Cartagena; estudiantes, coaches, correos,
teléfonos y robots son inventados. Correos en el dominio reservado .test y teléfonos
con prefijo 555, que no existen.
"""
import csv
import random
import unicodedata
from collections import Counter
from pathlib import Path

random.seed(2027)

INSTITUTIONS = [
    ("Institución Educativa Soledad Román de Núñez", "IESRN", 11),
    ("Institución Educativa INEM José Manuel Rodríguez Torices", "INEM", 12),
    ("Colegio Salesiano San Pedro Claver", "CSPC", 8),
    ("Institución Educativa Antonia Santos", "IEAS", 10),
    ("Institución Educativa Olga González Arraut", "IEOGA", 9),
    ("Colegio Biffi La Salle", "BIFFI", 10),
    ("Institución Educativa Técnica de Pasacaballos", "IETP", 7),
    ("Institución Educativa Rural Bayunca", "IERB", 4),
]

FIRST = ["Santiago", "Valentina", "Sebastián", "Isabella", "Mateo", "Mariana", "Samuel", "Sofía", "Juan David",
         "Gabriela", "Nicolás", "Daniela", "Andrés", "Camila", "Luis Carlos", "Laura", "Jesús", "Paula", "Alejandro",
         "Sara", "Miguel Ángel", "Valeria", "Emmanuel", "Ana Sofía", "Tomás", "Luciana", "Kevin", "María José",
         "Jhon", "Salomé", "Julián", "Antonella", "Esteban", "Natalia", "Carlos Andrés", "Yuliana"]
LAST = ["Pérez", "Herrera", "Castro", "Julio", "Marrugo", "Barrios", "Guerrero", "Martínez", "Rodríguez",
        "Cassiani", "Padilla", "Orozco", "Villalba", "Cabarcas", "Salgado", "Torres", "Díaz", "Gómez", "Ortega",
        "Blanco", "Mendoza", "Pájaro", "Zúñiga", "Arrieta", "Buelvas", "Caraballo", "Morales", "Jiménez"]
COACHES = ["Rafael Cassiani", "Liliana Marrugo", "Hernando Padilla", "Claudia Orozco", "Jorge Villalba",
           "Patricia Cabarcas", "Álvaro Salgado", "Yolanda Pérez"]
ROBOT_A = ["Rayo", "Titán", "Cóndor", "Mantis", "Jaguar", "Vórtice", "Tornado", "Kraken", "Halcón", "Pulsar",
           "Tritón", "Fénix", "Coral", "Relámpago", "Centella", "Boa", "Escorpión", "Cometa", "Atlas", "Orca"]
ROBOT_B = ["Caribe", "X", "Bot", "Heroico", "2.0", "Negro", "Azul", "Turbo", "Max", "Pro", "Mini", "Rojo",
           "Walled", "Getsemaní", "Bocagrande", "Manga", "Zeta", "Prime"]
GRADES = ["6°", "7°", "8°", "9°", "10°", "11°"]

# Inscritos objetivo por categoría (no potencias de 2 a propósito, para probar byes en las llaves).
TARGET = {"minisumo": 15, "sumo": 11, "sumo-rc": 14, "futbolito": 12, "seguidor-de-linea": 13,
          "laberinto-rc": 7, "circuito-dron": 9, "carrera-rc": 10, "explotaglobos": 8}
RC = ["sumo-rc", "futbolito", "carrera-rc", "explotaglobos", "laberinto-rc"]
# Categorías con las que se prueba "jugar en paralelo" (mismos carritos, formato eliminación las dos).
PARALLEL_PAIR = ("sumo-rc", "futbolito")
PARALLEL_OVERLAP_RATE = 0.65  # fracción de la categoría más chica que también corre la otra


def ascii_slug(text):
    text = unicodedata.normalize("NFD", text).encode("ascii", "ignore").decode()
    return text.lower().replace(" ", "")


def main():
    students = []
    used_names, used_emails, used_robots = set(), set(), set()
    phone = 100
    for (inst, sigla, count), coach in zip(INSTITUTIONS, COACHES):
        for _ in range(count):
            while True:
                name = f"{random.choice(FIRST)} {random.choice(LAST)} {random.choice(LAST)}"
                if name not in used_names:
                    used_names.add(name)
                    break
            parts = name.split()
            email = f"{ascii_slug(parts[0])}.{ascii_slug(parts[-2])}@correo.test"
            n = 2
            while email in used_emails:
                email = f"{ascii_slug(parts[0])}.{ascii_slug(parts[-2])}{n}@correo.test"
                n += 1
            used_emails.add(email)
            phone += 1
            students.append({"institución": inst, "sigla": sigla, "coach": coach, "nombre": name, "correo": email,
                             "whatsapp": f"555-0{phone}", "grado": random.choice(GRADES)})

    def robot_name(category):
        while True:
            base = f"{random.choice(ROBOT_A)} {random.choice(ROBOT_B)}"
            name = f"Dron {base}" if category == "circuito-dron" else base
            if name not in used_robots:
                used_robots.add(name)
                return name

    # Cada estudiante recibe al menos un robot; los cupos restantes crean segundos robots o categorías extra.
    slots = [c for c, n in TARGET.items() for _ in range(n)]
    random.shuffle(slots)
    rows = []
    order = students[:]
    random.shuffle(order)
    for student in order:
        category = slots.pop()
        rows.append({**student, "robot": robot_name(category), "categorías": [category]})
    for category in slots:
        rc_robot = [r for r in rows if category in RC and r["categorías"][0] in RC and category not in r["categorías"] and len(r["categorías"]) == 1]
        if rc_robot and random.random() < 0.6:
            random.choice(rc_robot)["categorías"].append(category)
        else:
            student = random.choice(students)
            rows.append({**student, "robot": robot_name(category), "categorías": [category]})

    # Refuerzo deliberado de solape entre PARALLEL_PAIR: en vez de dejarlo al azar (como el resto de RC),
    # aquí se fuerza una fracción alta para que "jugar en paralelo" tenga un caso real y grande que probar.
    cat_a, cat_b = PARALLEL_PAIR
    only_a = [r for r in rows if r["categorías"] == [cat_a]]
    only_b = [r for r in rows if r["categorías"] == [cat_b]]
    random.shuffle(only_a)
    random.shuffle(only_b)
    overlap_n = int(min(len(only_a), len(only_b)) * PARALLEL_OVERLAP_RATE)
    for r in only_a[:overlap_n]:
        r["categorías"].append(cat_b)

    # Casos límite para lo nuevo:
    # - 3 robots que corren Sumo RC, Futbolito y ExplotaGlobos (paralelo con tres categorías a la vez).
    triple = [r for r in rows if sorted(r["categorías"]) == sorted([cat_a, cat_b])]
    random.shuffle(triple)
    for r in triple[:3]:
        r["categorías"].append("explotaglobos")
    # - Un estudiante con 3 robots en categorías distintas.
    busy = random.choice([s for s in students if sum(1 for r in rows if r["correo"] == s["correo"]) == 1])
    for category in ["minisumo", "seguidor-de-linea"]:
        rows.append({**busy, "robot": robot_name(category), "categorías": [category]})
    # - 2 robots sin categoría, para asignarles una desde Asistencia (modo edición).
    for student in random.sample(students, 2):
        rows.append({**student, "robot": robot_name("sin-categoria"), "categorías": []})

    rows.sort(key=lambda r: (r["sigla"], r["nombre"]))
    out = Path(__file__).with_name("inscritos_prueba_cartagena.csv")
    with out.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["institución", "sigla", "coach", "nombre", "correo", "whatsapp", "grado", "robot", "categorías"])
        writer.writeheader()
        for r in rows:
            writer.writerow({**r, "categorías": "|".join(r["categorías"])})

    # Asistencia variada (se aplica después de importar): un colegio completo no llega y ~12 % del resto falta.
    late_school = "IERB"
    present = []
    for s in students:
        if s["sigla"] == late_school or random.random() < 0.12:
            continue
        present.append((s["correo"], f"07:{random.randint(0, 59):02d}" if random.random() < 0.7 else f"08:{random.randint(0, 45):02d}"))
    sql = Path(__file__).with_name("asistencia_prueba.sql")
    with sql.open("w", encoding="utf-8", newline="\n") as f:
        f.write("-- Asistencia de PRUEBA (generada por generar_inscritos.py). Ejecutar en Supabase → SQL Editor\n")
        f.write(f"-- después de importar inscritos_prueba_cartagena.csv. {len(present)} de {len(students)} llegan; {late_school} no llega.\n")
        f.write("update public.participants set attended_at = null where email like '%@correo.test';\n")
        f.write("update public.participants p set attended_at = (date '2026-09-29' + v.hora::time) at time zone 'America/Bogota'\n")
        f.write("from (values\n")
        f.write(",\n".join(f"  ('{email}', '{hora}')" for email, hora in present))
        f.write("\n) as v(email, hora)\nwhere p.email = v.email;\n")

    per_cat = Counter(c for r in rows for c in r["categorías"])
    per_inst = Counter(s["sigla"] for s in students)
    print(f"{out.name}: {len(rows)} filas, {len(students)} estudiantes, {len(rows)} robots")
    print("por institución:", dict(per_inst))
    print("por categoría:", dict(per_cat))
    print("robots en 2 categorías:", sum(1 for r in rows if len(r["categorías"]) == 2))
    print("robots en 3 categorías:", sum(1 for r in rows if len(r["categorías"]) == 3))
    print("robots sin categoría:", sum(1 for r in rows if not r["categorías"]))
    print("máximo de robots por estudiante:", max(Counter(r["correo"] for r in rows).values()))
    print(f"asistencia: {len(present)} presentes de {len(students)} ({late_school} no llega) → {sql.name}")
    both = [r for r in rows if cat_a in r["categorías"] and cat_b in r["categorías"]]
    print(f"robots en {cat_a} y {cat_b} a la vez:", len(both))
    print("estudiantes con 2+ robots:", sum(1 for n in Counter(r["correo"] for r in rows).values() if n > 1))


if __name__ == "__main__":
    main()
