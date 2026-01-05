# FotoDruk - Aplikacja do zamawiania wydruku zdjec

Kompletna aplikacja webowa do zamawiania zdjec do wydruku z czescia publiczna dla klientow oraz panelem administracyjnym.

## Funkcjonalnosci

### Czesc publiczna (klient)
- Strona glowna z oferta, cennikiem, FAQ i kontaktem
- Kreator zamowien z uploadem wielu zdjec (drag & drop)
- Edycja parametrow kazdego zdjecia (format, papier, wykonczenie, kadrowanie)
- Podglad jakosci/DPI z ostrzezeniami
- Grupowe operacje na zdjeciach
- Koszyk z podsumowaniem i rabatami
- Checkout z wyborem dostawy i platnoscia online (sandbox)
- Konto klienta z historia zamowien

### Panel administracyjny
- Zarzadzanie zamowieniami (statusy, eksport)
- Katalog produktow i wariantow
- Formaty, papiery, wykonczenia
- Cenniki progowe
- Kody rabatowe
- Metody dostawy
- Tresci (strony, FAQ)
- Ustawienia sklepu i branding
- Role uzytkownikow (admin, manager, worker, support)

### Funkcje techniczne
- Multi-tenant (wiele firm na jednej instancji)
- System kolejki do przetwarzania obrazow
- Powiadomienia email
- Platnosci online (sandbox mode)
- Responsywny design (mobile-first)
- Bezpieczenstwo (auth, walidacje, limity)

## Stack technologiczny

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Baza danych**: PostgreSQL + Prisma ORM
- **Autentykacja**: NextAuth.js
- **State management**: Zustand
- **Kolejka**: Bull + Redis
- **Email**: Nodemailer
- **Platnosci**: Modul abstrakcyjny (sandbox domyslnie)

## Wymagania

- Node.js 18+
- PostgreSQL 14+
- Redis (opcjonalnie, dla kolejki)

## Uruchomienie lokalne

### 1. Instalacja zaleznosci

```bash
npm install
```

### 2. Konfiguracja bazy danych

Utworz baze PostgreSQL:

```sql
CREATE DATABASE fotozamowienia;
```

### 3. Konfiguracja zmiennych srodowiskowych

Skopiuj plik `.env.example` do `.env` i uzupelnij:

```bash
cp .env.example .env
```

Edytuj plik `.env`:

```env
# Baza danych
DATABASE_URL="postgresql://postgres:password@localhost:5432/fotozamowienia"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="wygeneruj-losowy-sekret-min-32-znaki"

# Redis (opcjonalnie)
REDIS_URL="redis://localhost:6379"

# Email (dla dev uzywamy ethereal.email)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@fotodruk.pl"

# Platnosci
PAYMENT_MODE="sandbox"
PAYMENT_SANDBOX_SUCCESS_RATE=100
```

### 4. Inicjalizacja bazy danych

```bash
# Generowanie klienta Prisma
npm run db:generate

# Migracja schematu
npm run db:push

# Zaladowanie danych startowych
npm run db:seed
```

### 5. Uruchomienie serwera deweloperskiego

```bash
npm run dev
```

Aplikacja dostepna pod adresem: http://localhost:3000

### 6. Logowanie do panelu admina

- URL: http://localhost:3000/admin/login
- Email: admin@fotodruk.pl
- Haslo: admin123

## Uruchomienie na produkcji

### 1. Build aplikacji

```bash
npm run build
```

### 2. Uruchomienie serwera

```bash
npm start
```

### 3. Worker do przetwarzania obrazow (opcjonalnie)

```bash
npm run worker
```

## Struktura projektu

```
fotozamowienia/
  prisma/           # Schema bazy danych i seed
  src/
    app/            # Next.js App Router (strony i API)
      admin/        # Panel administracyjny
      api/          # API endpoints
      koszyk/       # Strona koszyka
      zamow/        # Kreator zamowien
      zamowienie/   # Szczegoly zamowienia
    components/     # Komponenty React
      admin/        # Komponenty panelu admina
      order/        # Komponenty kreatora zamowien
      ui/           # Komponenty bazowe (Button, Input, etc.)
    lib/            # Utilities, auth, db, email, payments
    store/          # Zustand stores (koszyk)
  uploads/          # Przechowywanie plikow (gitignored)
```

## Konfiguracja multi-tenant

Aby wlaczyc obsluge wielu firm:

```env
ENABLE_MULTI_TENANT=true
MAIN_DOMAIN="fotodruk.pl"
```

Kazda firma otrzymuje subdomena (np. firma1.fotodruk.pl) lub wlasna domene.

## Integracja platnosci

Domyslnie dziala tryb sandbox (symulacja platnosci). Aby podlaczyc rzeczywista bramke:

1. Dodaj implementacje providera w `src/lib/payments.ts`
2. Ustaw `PAYMENT_MODE` na nazwe providera
3. Dodaj wymagane klucze API

## Testy

```bash
# Uruchomienie testow
npm test

# Testy z coverage
npm run test:run
```

## Kody rabatowe testowe

- `WELCOME10` - 10% rabatu (min. 50 zl)
- `ZIMA2024` - 15% rabatu (min. 100 zl)
- `DOSTAWA` - darmowa dostawa (min. 50 zl)
- `RABAT20` - 20 zl rabatu (min. 80 zl)

## Produkty

- **Odbitki fotograficzne** - formaty od 9x13 do 15x15, cena od 0.49 zl
- **Plakaty** - formaty od 20x30 do 60x90, cena od 9.90 zl
- **Fotoalbumy** - 20-100 zdjec, cena od 89 zl
- **Obrazy na plotnie** - formaty od 30x40 do 60x90, cena od 59 zl

## Cennik progowy (odbitki)

- 1-9 szt: cena bazowa
- 10-49 szt: -10%
- 50-99 szt: -15%
- 100+ szt: -20%

## Metody dostawy

- Kurier DPD: 14.99 zl (gratis od 100 zl)
- Paczkomat InPost: 12.99 zl (gratis od 100 zl)
- Poczta Polska: 9.99 zl (gratis od 150 zl)
- Odbior osobisty: gratis

## Bezpieczenstwo

- Hasla hashowane bcrypt
- Sesje JWT (30 dni)
- Role i uprawnienia
- Walidacja uploadu (typ, rozmiar)
- Rate limiting (do wdrozenia)
- CSRF protection (NextAuth)

## RODO/GDPR

- Polityka prywatnosci
- Zgoda na marketing
- Retencja zdjec (konfigurowalna, domyslnie 90 dni)
- Mozliwosc usuwania danych na zadanie

## Licencja

Projekt prywatny. Wszelkie prawa zastrzezone.
