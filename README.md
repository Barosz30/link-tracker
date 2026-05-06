# Link Tracker (NestJS)

Mikroserwis do tworzenia linków do projektów, publicznego przekierowania i zliczania statystyk wejść:
- liczba otwarć (`clickCount`),
- data ostatniego otwarcia (`lastAccessedAt`).

## Wymagania

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Szybki start

1. Zainstaluj zależności:

```bash
npm install
```

2. Skopiuj konfigurację środowiska:

```bash
cp .env.example .env
```

Na Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

3. Uruchom PostgreSQL:

```bash
docker compose up -d
```

4. Uruchom migracje:

```bash
npm run migration:run
```

5. Uruchom aplikację:

```bash
npm run start:dev
```

Aplikacja domyślnie działa na `http://localhost:3000`.

## Konfiguracja `.env`

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=link_tracker
```

## Endpointy API

- `POST /links` - tworzy link
- `GET /links` - lista linków
- `GET /links/:slug/stats` - statystyki linku
- `DELETE /links/:slug` - usuwa link
- `GET /r/:slug` - publiczny redirect i aktualizacja statystyk

## Przykładowe requesty

### 1) Utworzenie linku

```bash
curl -X POST http://localhost:3000/links \
  -H "Content-Type: application/json" \
  -d "{\"slug\":\"tracker\",\"targetUrl\":\"https://github.com/twoj-projekt\"}"
```

Przykładowa odpowiedź:

```json
{
  "id": "d5c7d8f2-b03c-45db-80a3-0a8462f2d7a9",
  "slug": "tracker",
  "targetUrl": "https://github.com/twoj-projekt",
  "clickCount": 0,
  "lastAccessedAt": null,
  "createdAt": "2026-05-06T10:00:00.000Z",
  "updatedAt": "2026-05-06T10:00:00.000Z"
}
```

### 2) Wejście w link (redirect)

```bash
curl -i http://localhost:3000/r/tracker
```

Odpowiedź zawiera status `302` i nagłówek `Location`.

### 3) Odczyt statystyk

```bash
curl http://localhost:3000/links/tracker/stats
```

Przykładowa odpowiedź:

```json
{
  "slug": "tracker",
  "clickCount": 1,
  "lastAccessedAt": "2026-05-06T10:02:31.452Z",
  "createdAt": "2026-05-06T10:00:00.000Z"
}
```

### 4) Lista linków

```bash
curl http://localhost:3000/links
```

### 5) Usunięcie linku

```bash
curl -X DELETE http://localhost:3000/links/tracker
```

## Testy i jakość

```bash
npm run build
npm test -- --runInBand
npm run test:e2e
```

## Przydatne komendy

```bash
npm run migration:run
npm run migration:revert
```
