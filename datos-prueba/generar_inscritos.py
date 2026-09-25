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

random.seed(2026)

INSTITUTIONS = [
    ("Institución Educativa Soledad Román de Núñez", "IESRN", 10),
    ("Institución Educativa INEM José Manuel Rodríguez Torices", "INEM", 10),
    ("Colegio Salesiano San Pedro Claver", "CSPC", 9),
    ("Institución Educativa Antonia Santos", "IEAS", 9),
    ("Institución Educativa Olga González Arraut", "IEOGA", 10),
    ("Colegio Biffi La Salle", "BIFFI", 9),
    ("Institución Educativa Técnica de Pasacaballos", "IETP", 9),
]

FIRST = ["Santiago", "Valentina", "Sebastián", "Isabella", "Mateo", "Mariana", "Samuel", "Sofía", "Juan David",
         "Gabriela", "Nicolás", "Daniela", "Andrés", "Camila", "Luis Carlos", "Laura", "Jesús", "Paula", "Alejandro",
         "Sara", "Miguel Ángel", "Valeria", "Emmanuel", "Ana Sofía", "Tomás", "Luciana", "Kevin", "María José",
         "Jhon", "Salomé", "Julián", "Antonella", "Esteban", "Natalia", "Carlos Andrés", "Yuliana"]
LAST = ["Pérez", "Herrera", "Castro", "Julio", "Marrugo", "Barrios", "Guerrero", "Martínez", "Rodríguez",
        "Cassiani", "Padilla", "Orozco", "Villalba", "Cabarcas", "Salgado", "Torres", "Díaz", "Gómez", "Ortega",
        "Blanco", "Mendoza", "Pájaro", "Zúñiga", "Arrieta", "Buelvas", "Caraballo", "Morales", "Jiménez"]
COACHES = ["Rafael Cassiani", "Liliana Marrugo", "Hernando Padilla", "Claudia Orozco", "Jorge Villalba",
           "Patricia Cabarcas", "Álvaro Salgado"]
ROBOT_A = ["Rayo", "Titán", "Cóndor", "Mantis", "Jaguar", "Vórtice", "Tornado", "Kraken", "Halcón", "Pulsar",
           "Tritón", "Fénix", "Coral", "Relámpago", "Centella", "Boa", "Escorpión", "Cometa", "Atlas", "Orca"]
ROBOT_B = ["Caribe", "X", "Bot", "Heroico", "2.0", "Negro", "Azul", "Turbo", "Max", "Pro", "Mini", "Rojo",
           "Walled", "Getsemaní", "Bocagrande", "Manga", "Zeta", "Prime"]
GRADES = ["6°", "7°", "8°", "9°", "10°", "11°"]

# Inscritos objetivo por categoría (no potencias de 2 a propósito, para probar byes en las llaves).
TARGET = {"minisumo": 12, "sumo": 8, "sumo-rc": 10, "futbolito": 8, "seguidor-de-linea": 11,
          "laberinto-rc": 6, "circuito-dron": 7, "carrera-rc": 9, "explotaglobos": 8}
RC = ["sumo-rc", "futbolito", "carrera-rc", "explotaglobos", "laberinto-rc"]


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

    rows.sort(key=lambda r: (r["sigla"], r["nombre"]))
    out = Path(__file__).with_name("inscritos_prueba_cartagena.csv")
    with out.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["institución", "sigla", "coach", "nombre", "correo", "whatsapp", "grado", "robot", "categorías"])
        writer.writeheader()
        for r in rows:
            writer.writerow({**r, "categorías": "|".join(r["categorías"])})

    per_cat = Counter(c for r in rows for c in r["categorías"])
    per_inst = Counter(s["sigla"] for s in students)
    print(f"{out.name}: {len(rows)} filas, {len(students)} estudiantes, {len(rows)} robots")
    print("por institución:", dict(per_inst))
    print("por categoría:", dict(per_cat))
    print("robots en 2 categorías:", sum(1 for r in rows if len(r["categorías"]) > 1))
    print("estudiantes con 2+ robots:", sum(1 for n in Counter(r["correo"] for r in rows).values() if n > 1))


if __name__ == "__main__":
    main()
