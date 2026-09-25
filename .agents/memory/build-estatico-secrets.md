---
name: Build estático y Secrets
description: Diferencia entre configurar Vite en desarrollo y actualizar una versión publicada.
---

Los valores VITE_ añadidos a Replit después de una publicación no reparan automáticamente el sitio estático ya compilado; hay que reconstruirlo y volver a publicarlo para que los incorpore.

**Why:** La vista previa pudo conectarse a Supabase tras reiniciar, mientras que la versión publicada seguía mostrando el aviso de base de datos sin configurar.

**How to apply:** Tras cambiar variables de compilación, verificar vista previa y publicación por separado. No afirmar que el sitio público está listo hasta comprobar una publicación posterior que incorpore esos valores.