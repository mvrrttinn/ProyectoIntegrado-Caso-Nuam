# Guía de Contribución y Estrategia de Ramas

Para garantizar la calidad del código, el aislamiento de funciones y la revisión por pares, el proyecto adopta la siguiente estrategia de GitFlow adaptado.

## Estrategia de Ramas
- **`main`**: Refleja el estado en producción. Código 100% estable, probado y aprobado.
- **`develop`**: Rama principal de integración. Todas las nuevas características se fusionan aquí antes de pasar a `main`.

### Nomenclatura de Ramas de Trabajo
Toda rama debe crearse a partir de `develop` utilizando los siguientes prefijos:
- `feature/nombre-de-la-funcionalidad` (Ej: `feature/cu01-ingesta-csv`)
- `fix/descripcion-del-error` (Ej: `fix/descuadre-decimales-dj1949`)
- `docs/descripcion-documentacion` (Ej: `docs/actualizacion-mer-supabase`)

## Proceso de Pull Request (PR)
1. Desarrolla tu funcionalidad en una rama `feature/` o `fix/`.
2. Asegúrate de que el código compila y las pruebas locales pasan.
3. Abre un PR apuntando a la rama `develop`.
4. Utiliza la plantilla de PR del repositorio para documentar los cambios.
5. El PR debe ser revisado y aprobado por al menos otro miembro del equipo (Angelo, Martín o Vicente) antes de realizar el merge.