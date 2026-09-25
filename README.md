# TT Real Estate | Antares — kalkulator troška kupnje

Brza, dvojezična (HR/EN) statička web aplikacija koja potencijalnom kupcu prikazuje transparentnu procjenu **ukupnog troška kupnje nekretnine u Hrvatskoj**. Uz kupoprodajnu cijenu obuhvaća porez na promet nekretnina, opcionalnu agencijsku proviziju i PDV na proviziju te standardne i vlastite dodatne troškove.

> Kalkulator je informativan. Ne zamjenjuje pravni, porezni ili financijski savjet.

## Struktura projekta

| Datoteka | Namjena |
| --- | --- |
| `index.html` | Semantička struktura cijelog sučelja |
| `styles.css` | Responzivni vizualni identitet i mobilni prikaz |
| `app.js` | Upravljanje sučeljem, prijevodima i prikazom rezultata |
| `calculator.js` | Jedinstvena, neovisna poslovna logika izračuna |
| `config.js` | Centralna konfiguracija poreznih stopa, CTA e-maila i APN poveznice |
| `translations.js` | Sve vidljive HR i EN poruke i opcije |
| `test/calculator.test.js` | Automatizirani testovi ključnih scenarija |

Projekt nema backend, bazu podataka, analitiku ni vanjske JavaScript biblioteke.

## Lokalno pokretanje

Potreban je samo statički HTTP poslužitelj. Iz korijena projekta pokrenite:

```bash
npm run serve
```

Zatim otvorite <http://localhost:4173>. Alternativno možete pokrenuti `python3 -m http.server 4173`.

Testove pokrenite naredbom:

```bash
npm test
```

## Konfiguracija

Sve poslovne vrijednosti koje se mogu mijenjati nalaze se na jednom mjestu, u `config.js`:

```js
export const CONFIG = Object.freeze({
  realEstateTransferTaxRate: 0.03,
  croatianVatRate: 0.25,
  ctaEmail: 'info.ttnekretnine@gmail.com',
  apnCalculatorsUrl: 'https://apn.hr/...',
});
```

- `realEstateTransferTaxRate`: stopa poreza na promet nekretnina kao decimalni broj (`0.03` = 3%).
- `croatianVatRate`: standardna stopa hrvatskog PDV-a kao decimalni broj (`0.25` = 25%). Primjenjuje se isključivo na proviziju kada korisnik odabere da se PDV dodaje.
- `ctaEmail`: adresa primatelja unaprijed pripremljenog HR/EN CTA e-maila.
- `apnCalculatorsUrl`: službena poveznica na APN kalkulatore, prikazana kao odvojena informativna napomena i ne uključuje se u izračun.

Nakon promjene stopa preporučuje se prilagoditi tekstualna objašnjenja stopa u `translations.js` i pokrenuti testove.

## HR/EN sustav

Hrvatski je zadani jezik. `translations.js` sadrži dva rječnika s jednakim ključevima. `app.js` pri promjeni jezika osvježava tekst, opcije, pomoćne poruke, validaciju, nazive stavki rezultata, `lang` atribut dokumenta i format brojeva. Poslovna logika ostaje zajednička u `calculator.js`; prijevodi je ne dupliciraju niti mijenjaju.

Euro iznosi formatiraju se pomoću `Intl.NumberFormat`: lokalitet `hr-HR` za hrvatski i `en-IE` za engleski prikaz.

## Statička objava

Sadržaj repozitorija može se prenijeti na bilo koji statički hosting (Netlify, Cloudflare Pages, S3 i slično) bez build koraka. Poslužitelj mora samo isporučivati datoteke iz korijena projekta.

### GitHub Pages

1. Pushajte repozitorij na GitHub.
2. Otvorite **Settings → Pages**.
3. Pod **Build and deployment** odaberite **Deploy from a branch**.
4. Odaberite željenu granu (najčešće `main`) i mapu **`/ (root)`**.
5. Spremite postavke. GitHub će prikazati javnu adresu nakon objave.

Budući da aplikacija upotrebljava relativne putanje, radi i kada je objavljena u podmapi GitHub Pages projekta.
