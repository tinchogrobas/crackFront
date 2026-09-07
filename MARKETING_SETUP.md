# Puesta en marcha de medición y publicidad

Todo lo del código ya está. Lo que queda es dar de alta las cuentas y pegar los
IDs en las variables de entorno de Vercel. Cada pieza es independiente: si una
variable está vacía, esa integración no se carga y el resto sigue funcionando.

El orden importa — cada paso depende del anterior.

---

## 0. Variable que hay que setear sí o sí

```
NEXT_PUBLIC_SITE_URL=https://cracktcg.com
```

Sin esto el fallback es el dominio de preview de Vercel, y los canonical, los
sitemaps y los feeds apuntan al sitio equivocado. Es la variable de mayor
impacto de toda la lista.

---

## 1. Google Analytics 4

1. analytics.google.com → Administrar → Crear propiedad (zona horaria Argentina, moneda ARS).
2. Flujo de datos web → `https://cracktcg.com`. Copiar el ID `G-XXXXXXXXXX`.
3. En Vercel: `NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX`.
4. Deploy y verificar en GA4 → Informes → Tiempo real.

El ecommerce ya está instrumentado end-to-end: `view_item_list`, `select_item`,
`view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`,
`add_shipping_info`, `add_payment_info`, `purchase`, `search`, `generate_lead`.
No hay que configurar nada en GA4 salvo marcar `purchase` y `generate_lead`
como eventos clave (Administrar → Eventos clave).

---

## 2. Google Ads + conversiones

1. Crear la cuenta y vincularla con GA4 (Herramientas → Cuentas vinculadas).
2. Objetivos → Conversiones → Nueva acción → Sitio web → **Configurar manualmente
   con código**. Crear una acción por cada una:

   | Acción         | Categoría | Variable de entorno                    |
   |----------------|-----------|----------------------------------------|
   | Compra         | Compra    | `NEXT_PUBLIC_ADS_LABEL_PURCHASE`       |
   | Inicio checkout| Otro      | `NEXT_PUBLIC_ADS_LABEL_BEGIN_CHECKOUT` |
   | Agregar carrito| Otro      | `NEXT_PUBLIC_ADS_LABEL_ADD_TO_CART`    |
   | Lead           | Lead      | `NEXT_PUBLIC_ADS_LABEL_LEAD`           |

3. Google muestra el snippet como `send_to: 'AW-123456789/AbC-D_efGh12345'`.
   - `AW-123456789` → `NEXT_PUBLIC_GOOGLE_ADS_ID`
   - `AbC-D_efGh12345` (solo lo de después de la barra) → la variable de la tabla.
4. En la acción de Compra, activar **Conversiones optimizadas** → "con etiqueta
   de Google". El código ya manda `user_data` con mail, teléfono y domicilio en
   el checkout, que es lo que recupera las conversiones cuando se pierde la cookie.

**Solo la acción de Compra debe estar marcada como "Conversión principal".** Las
otras tres van como secundarias: si dejás las cuatro como principales, Smart
Bidding optimiza para que agreguen al carrito y no para que compren.

---

## 3. Meta Pixel + Conversions API

1. business.facebook.com → Administrador de eventos → Conectar datos → Web.
2. Copiar el ID del pixel → `NEXT_PUBLIC_META_PIXEL_ID`.
3. Para la CAPI (recomendado: recupera entre 15% y 30% de eventos que los ad
   blockers y Safari se comen):
   - Configuración del pixel → Conversions API → Generar token de acceso.
   - `META_CAPI_ACCESS_TOKEN=<token>` — **sin** el prefijo `NEXT_PUBLIC_`, si no
     queda expuesto en el bundle del browser y cualquiera puede escribir eventos.
   - `NEXT_PUBLIC_META_CAPI_ENABLED=true`
4. Para probar: Administrador de eventos → Probar eventos → copiar el código y
   ponerlo en `META_CAPI_TEST_EVENT_CODE`. **Vaciarlo antes de ir a producción**:
   los eventos con test code no cuentan para las campañas.

Pixel y CAPI mandan el mismo `event_id`, así que Meta deduplica solo. En
"Administrar integraciones" tiene que aparecer como eventos deduplicados; si
aparecen duplicados, algo rompió el `event_id`.

---

## 4. Google Merchant Center — el paso de mayor impacto

Los sitemaps meten las páginas en el índice orgánico. Esto es lo que pone las
fichas con foto y precio en la pestaña Shopping y en el carrusel del buscador,
**gratis**, y lo que habilita las campañas Performance Max.

1. merchantcenter.google.com → crear cuenta → verificar y reclamar `cracktcg.com`.
2. Envíos y devoluciones → cargar las tarifas reales por zona y método, y la
   política de devolución (10 días, que es lo que declara el sitio).
3. Productos → Feeds → **Feed programado**:
   - URL: `https://cracktcg.com/feeds/google-merchant.xml`
   - Frecuencia: diaria
   - País: Argentina · Idioma: Español · Moneda: ARS
4. Activar "Listados gratuitos" (Growth → Manage programs).

El feed sale de `/products/feed/` del backend y descarta solo las filas sin
precio o sin imagen, que Google rechazaría igual.

**Sobre `condition`:** sellados y accesorios van como `new`; los singles se
declaran `new` solo si la condición es Mint/Near Mint, y `used` en cualquier
otro caso. Declarar todo como nuevo es causa de suspensión de la cuenta.

**Si querés incluir el envío en el feed** en vez de manejarlo por reglas de
cuenta: `NEXT_PUBLIC_FEED_SHIPPING_ARS=<monto>`. En 0 se omite el bloque y
mandan las reglas de Merchant Center, que es lo que conviene porque el envío
varía por zona.

---

## 5. Catálogo de Meta

Commerce Manager → Catálogos → Crear → Comercio electrónico → Subir información
del producto → **Feed programado**:

- URL: `https://cracktcg.com/feeds/meta-catalog.csv`
- Frecuencia: diaria

Después vincular el catálogo con el pixel (Configuración del catálogo → Fuentes
de eventos). Recién ahí funciona el retargeting dinámico: los `content_ids` que
manda el pixel son los mismos `id` del catálogo.

---

## 6. Google Tag Manager (opcional)

`NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX` carga el contenedor. **No hace falta**: los
tags directos de GA4/Ads/Pixel ya están y son más livianos. Sirve si querés
sumar tags de terceros sin tocar el código — todos los eventos de ecommerce ya
se empujan al `dataLayer` con el esquema de GA4, así que se leen desde GTM sin
cambiar nada.

---

## Checklist post-deploy

- [ ] GA4 → Tiempo real muestra tráfico
- [ ] GA4 → Monetización → Compras de comercio electrónico registra una orden de prueba
- [ ] Meta → Administrador de eventos muestra los eventos como deduplicados
- [ ] Merchant Center → Diagnóstico: cero productos rechazados
- [ ] `https://cracktcg.com/feeds/google-merchant.xml` devuelve XML con `<item>`
- [ ] Prueba de resultados enriquecidos (search.google.com/test/rich-results)
      sobre una ficha de producto: sin errores en Product, Offer y Store
- [ ] Google Business Profile del local de Deheza 2921 creado y verificado —
      los datos tienen que coincidir carácter por carácter con el schema `Store`
      de `lib/seo.js`, si no Google los descarta por inconsistentes

## Dónde vive cada cosa

| Archivo | Qué hace |
|---|---|
| `src/lib/analytics.config.js` | IDs, feature flags y bootstrap de Consent Mode v2 |
| `src/lib/analytics.js` | Capa única de eventos: dataLayer + gtag + fbq + CAPI |
| `src/components/analytics/` | Carga de tags, page_view del SPA y banner de cookies |
| `src/app/api/track/route.js` | Conversions API de Meta (server-side, con hashing) |
| `src/lib/feeds.js` | Mapeo de producto a feed (condición, taxonomía, etiquetas) |
| `src/app/feeds/*` | Los dos feeds |
| `apps/products/views.py` → `feed` | Endpoint del catálogo completo (backend) |
