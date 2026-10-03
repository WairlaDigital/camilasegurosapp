# Prueba manual del checkout con Culqi

Prueba de punta a punta del pago contra la **API local** (`app-soat-taxi.test`) con la **llave de pruebas de Culqi**. No es automática: la hace una persona, con sus propios datos. Las e2e nunca usan la API real (ver [react-nextjs.md](../.claude/rules/react-nextjs.md#pruebas)).

Qué hay detrás (revisado el 2026-09-29): el backend local cotiza y emite contra los servicios **QA** de La Positiva, cobra con una llave `sk_test_` de Culqi, envía correos **reales** con Resend y tiene un queue worker corriendo (Herd).

## Resultados (2026-10-02/03)

Con La Positiva **simulada** en el backend local (QA se apaga después de las 8 p. m.): placa M5G-340 con 5 asientos, stock disponible y tarifa de S/ 85.00 con token `BYPASS-…`, en un cambio temporal sin commit en `app-soat-taxi` (`PositivaApiClient`, marcado `TEMP BYPASS`). El cobro con Culqi sí es real (modo de pruebas). Detalle por caso en la tabla.

## Antes de empezar

1. **⚠ Webhook de Culqi en pruebas.** Revisado el 2026-09-30: apunta a una URL de pruebas. En el CulqiPanel, entorno de integración → Desarrollo → Webhooks, revisa a qué URL apunta. Tras un pago, Culqi llama a esa URL con el id de la póliza (`metadata.order`). La base local parece una copia de producción, así que los ids coinciden con pólizas reales: **si el webhook de pruebas apunta al backend de producción, no hagas la prueba** hasta cambiarlo. Una URL local no es un problema: Culqi no llega a `app-soat-taxi.test` y la emisión se simula a mano (ver abajo).
2. **Tus datos.** Tu DNI y tu correo: el backend valida que el dominio del correo exista y te llegarán correos reales. Celular que empiece con 9. Placa: una que exista en el ambiente QA de La Positiva.
3. **Llave pública.** `NEXT_PUBLIC_CULQI_PUBLIC_KEY` (en `.env.local`) debe ser de la **misma cuenta de Culqi** que la `sk_test_` del backend. Si no lo es, el modal de Culqi no reconoce la orden (caso 1 falla al abrir el modal).
4. **Arrancar el front** contra la API local: `npx next dev --port 3101` (o la configuración `checkout-real-api` del panel de vista previa) y abrir http://localhost:3101. El `.env.local` real debe estar en la carpeta donde corres el comando.

Cada intento de pago cuenta dos veces en el límite por persona (20 cada 10 min): si lo alcanzas, espera o reinicia el servidor.

## Casos

Tarjetas de [la documentación de Culqi](https://docs.culqi.com/es/documentacion/pagos-online/tarjetas-de-prueba). Para cada caso: cotiza, elige el plan, completa el titular y presiona «Continuar con el pago».

| # | Medio | Datos | Resultado esperado en el front | Resultado |
|---|---|---|---|---|
| 1 | Visa exitosa | 4111 1111 1111 1111 · 09/30 · 123 | El modal se cierra y aparece «¡Listo, {nombre}! Recibimos tu pago» con placa, vigencia y total | ✅ 2026-10-02: cargo `chr_test_Lwq2CyCrWOSsajbp` (S/ 85.00, póliza 4249) |
| 2 | Fondos insuficientes | 4000 0400 0000 0008 · 03/30 · 295 | Mensaje «No pudimos procesar tu pago…» y se queda en «Antes de pagar». **Si muestra «Recibimos tu pago», se confirma el 🔴 del backend** (pago rechazado reportado como éxito) | ✅ 2026-10-03: Culqi lo denegó (`chr_test_2fofdAu6hAcsVk2F`, póliza 4252) y el front mostró el mensaje de error |
| 3 | Tarjeta robada | 4000 0200 0000 0000 · 10/30 · 354 | Igual que el caso 2 | ✅ 2026-10-03: Culqi lo denegó (`DNGE0031`, `chr_test_3nmIcA8IRVZZrTKy`, póliza 4253) y el front mostró el mensaje de error |
| 4 | Yape | Celular 900 000 001 · código: 6 dígitos cualesquiera | Igual que el caso 1 | |
| 5 | Banca móvil / agente / billetera | Elegir el método en el modal | Culqi muestra el código de pago; al cerrar el modal se ve «Tu código de pago está listo». Anota si el código **llega al correo** (la pantalla lo promete) | |
| 6 | 3DS | 4456 5300 0000 1096 · 07/30 · 111 | El backend no soporta 3DS: se espera el mensaje del caso 2. Anota qué hace el modal | ✅ 2026-10-03: sin verificación 3DS; Culqi lo denegó directamente (`DNGE0116`, `chr_test_EEPuJytpPavIwdVX`, póliza 4254) y el front mostró el mensaje de error |
| 7 | Reintento | Abrir el modal, cerrarlo y volver a presionar «Continuar con el pago» | El monto y la orden son los mismos. En el backend, **una sola** póliza nueva (ver abajo) | |
| 8 | Ya pagado | Tras el caso 1, volver a `/cotizar/antes-de-pagar` | Redirige a la confirmación; no se puede pagar dos veces | |

Revisa también en el CulqiPanel (entorno de integración) que cada cargo y cada orden aparezcan con el estado esperado.

## Ver lo que creó el backend

Últimas pólizas (id, estado y orden de Culqi), solo lectura:

```bash
cd ~/sites/app-soat-taxi && php artisan tinker --execute='echo App\Models\Policy::latest("id")->take(3)->get(["id","status","payment","created_at"])->map(fn($p)=>["id"=>$p->id,"status"=>$p->status?->value,"order"=>$p->payment["order_id"] ?? null,"created"=>(string)$p->created_at])->toJson(JSON_PRETTY_PRINT);'
```

Tras un pago exitoso la póliza sigue `pending`: la emisión la dispara el webhook de Culqi, que no llega al backend local.

## Simular el webhook (emisión y correo)

Solo con una póliza **creada en esta prueba** (su id sale del comando anterior). Dispara la emisión en La Positiva QA y el correo al titular:

```bash
curl -k -X POST https://app-soat-taxi.test/api/culqi-service -H "Content-Type: application/json" -H "Accept: application/json" -d '{"object":"event","type":"charge.creation.succeeded","data":{"metadata":{"order":ID_DE_LA_POLIZA}}}'
```

Luego vuelve a consultar las pólizas: debería pasar a `issued` (o `failed`, con el motivo en `storage/logs/laravel.log`), y el PDF debería llegar a tu correo.

## Al terminar

Anota los resultados en la tabla y actualiza [PENDIENTES.md](../PENDIENTES.md): el 🔴 del pago rechazado (casos 2 y 3), 3DS (caso 6), el correo del código de pago (caso 5) y cualquier diferencia con lo esperado.
