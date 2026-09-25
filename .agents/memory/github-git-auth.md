---
name: GitHub y Git en terminal
description: Diferencia entre la conexión de GitHub para API y las credenciales de Git en la terminal.
---

La conexión OAuth de GitHub en Replit puede permitir operaciones mediante la API y, a la vez, dejar `git push` por HTTPS sin credenciales válidas. No asumir que conectar GitHub para la API también habilita Git de la terminal.

**Why:** En este entorno la conexión autorizó escrituras mediante la API, pero el comando `git push` siguió devolviendo un error de usuario o token inválido. Una segunda vía fue necesaria para publicar el repositorio sin acceder directamente a credenciales.

**How to apply:** Si una futura subida por Git falla, comprobar por separado la autenticación del Git de terminal; no pedir tokens por chat ni asumir que la conexión de la API reparará el ayudante de credenciales. Indicar claramente al usuario si se usó la API como alternativa.