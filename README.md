# spotify playlist editor

minimal personal-use spotify playlist editor built with next.js app router + auth.js.

## v0 features

- sign in with spotify
- view your playlists
- view playlist items
- reorder tracks
- remove tracks

## stack

- next.js
- auth.js / nextauth spotify provider
- route handlers for spotify web api calls
- no database

## spotify app setup

in the spotify developer dashboard:

1. create a new app
2. add this redirect uri for local development:

```txt
http://127.0.0.1:3000/api/auth/callback/spotify
```

3. copy your client id and client secret into `.env.local`

## env

copy `.env.example` to `.env.local` and fill in the values.

## install

```bash
npm install
npm run dev
```

open `http://127.0.0.1:3000`.

## notes

- this starter assumes personal use only
- it does not include refresh-token rotation hardening yet
- it does not include add-track ui yet, though the server shape leaves room for it later
