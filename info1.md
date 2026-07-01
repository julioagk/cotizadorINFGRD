Quiero desarrollar un sistema web de cotización y calculadora para aplicaciones de recubrimiento anticorrosivo en serpentines.

Cotizador

Al presionar Nueva Cotización, primero deberá preguntar:

Cliente existente
Cliente nuevo
Cliente existente

Si se selecciona un cliente existente, el sistema deberá cargar automáticamente toda su información y su lista de precios.

Cada cliente ya tiene:

Nombre
Datos del cliente
Factor cliente
Lista de precios personalizada

La lista de precios ya contiene todos los modelos con sus precios.

Para realizar una cotización únicamente se deberá seleccionar:

Tipo de equipo
Serie
Modelo
Oferta
Cantidad

El precio aparecerá automáticamente según la lista de precios del cliente.

No deberá realizar ningún cálculo.

Simplemente agregará el producto a la cotización.

Tipos de equipos

El sistema deberá manejar diferentes tipos de equipos para organizar los modelos.

Inicialmente deberá soportar:

Serpentines Condensadores
Serpentines Evaporadores
VRF
Condensadoras
Evaporadoras
Chillers
Equipos Paquete
Equipos Especiales

Cada tipo contiene diferentes series.

Ejemplo:

AVWT
AVWW
AVW
AVBC
AVK
AVS
AVV
AVH

Cada serie contiene múltiples modelos, tal como aparecen en el archivo de Excel.

Ofertas

Cada modelo puede tener hasta 3 ofertas, aunque no todos los modelos necesariamente tendrán las tres.

Las ofertas son:

Serpentín Condensador / Evaporador
Serpentín + Gabinete
Recubrimiento Completo

Dependiendo del modelo, algunas ofertas pueden no existir.

El sistema deberá mostrar únicamente las ofertas disponibles para el modelo seleccionado.

Cada oferta tendrá su propio precio.

Cotización

La cotización deberá permitir agregar múltiples conceptos.

Cada concepto deberá contener:

Cantidad
Modelo
Descripción
Oferta
Precio Unitario
Importe

Al finalizar, el sistema deberá generar automáticamente una cotización en PDF con un diseño muy similar al formato que utiliza actualmente la empresa.

El PDF deberá incluir:

Logo de la empresa.
Datos de la empresa.
Datos del cliente.
Folio.
Fecha.
Tabla con los productos cotizados.
Cantidad.
Modelo.
Descripción.
Precio unitario.
Importe.
Subtotal.
IVA.
Total.
Observaciones.
Espacio para firma.

El diseño debe ser muy parecido al PDF proporcionado.

Cliente nuevo

Si el cliente es nuevo, primero deberá capturar sus datos.

Después deberá seleccionar el tipo de cliente.

Los tipos de cliente son:

OEM (Factor 3.0)
Distribuidor Fábrica (Factor 3.7)
Distribuidor / Wholesaler (Factor 4.0)
Refrigeración Industrial (Factor 4.5)
Contratista (Factor 4.8)

Después de crear el cliente deberán aparecer dos opciones.

Opción 1

Subir un archivo Excel con modelos y precios.

Opción 2

Utilizar la calculadora.

Calculadora

La calculadora únicamente calculará serpentines.

Existen dos tipos:

Serpentín Condensador
Serpentín Evaporador

Para un Serpentín Condensador:

1 m² = 0.09 galones

Para un Serpentín Evaporador:

1 m² = 0.16 galones

Después deberá multiplicar la cantidad de galones por el costo del galón.

Actualmente el costo del galón es de 450 USD.

Después deberá multiplicar ese resultado por el factor del cliente.

Factores:

OEM = 3.0
Distribuidor Fábrica = 3.7
Distribuidor / Wholesaler = 4.0
Refrigeración Industrial = 4.5
Contratista = 4.8

Hay casos donde algunos serpentines, por su gran ancho, requieren aplicar el líquido dos o tres veces.

Actualmente no existe una regla definida para determinar cuándo sucede.

Por lo tanto, la calculadora deberá permitir seleccionar manualmente un multiplicador:

x1
x2
x3

Ese multiplicador deberá aplicarse a la cantidad de galones antes de calcular el costo.

Interfaz

Quiero una interfaz moderna, limpia, rápida e intuitiva.

El objetivo es que una cotización pueda realizarse en muy pocos clics y que el proceso sea sencillo tanto para clientes existentes como para clientes nuevos.