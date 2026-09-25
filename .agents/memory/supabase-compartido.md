---
name: Supabase compartido
description: Riesgo de permisos en tablas ajenas al torneo dentro del proyecto conectado.
---

El proyecto Supabase utilizado por el torneo contiene también tablas que parecen pertenecer a otra aplicación. Algunas tienen RLS desactivado y el rol anónimo conserva privilegios de lectura y escritura. No cambiar esas tablas sin conocer qué aplicaciones las usan y cuáles son sus políticas de acceso previstas.

**Why:** Una revisión de solo lectura confirmó que los permisos amplios existen aunque las tablas estén actualmente vacías. Activar RLS sin políticas podría interrumpir una aplicación ajena; ignorarlo dejaría expuestos datos futuros.

**How to apply:** Antes de recomendar publicar o anunciar el sitio, advertir del riesgo y acordar con el propietario el uso de esas tablas; diseñar políticas o separar proyectos antes de alterar permisos. Mantener separada la revisión de las tablas propias del torneo.