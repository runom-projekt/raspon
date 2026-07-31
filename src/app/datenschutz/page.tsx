import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Datenschutzerklärung" };

export default function DatenschutzPage() {
  return (
    <LegalPageLayout title="Datenschutzerklärung" updated="Juli 2026">
      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
        <br />
        HMS Runo, Inhaber Marcin Runo, Doomerstraße 4, 47877 Willich, Deutschland
        <br />
        E-Mail: kontakt@raspon.de, Telefon: +49 176 2323 6768
      </p>

      <h2>2. Allgemeines zur Datenverarbeitung</h2>
      <p>
        Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur
        Bereitstellung einer funktionsfähigen Plattform (Vermittlung von Anhänger-Mietverträgen zwischen
        Vermietern und Mietern) sowie unserer Inhalte und Leistungen erforderlich ist. Rechtsgrundlagen sind
        insbesondere Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung/vorvertragliche Maßnahmen), Art. 6 Abs. 1
        lit. f DSGVO (berechtigtes Interesse, z. B. IT-Sicherheit) und Art. 6 Abs. 1 lit. c DSGVO
        (gesetzliche Verpflichtungen, z. B. steuerrechtliche Aufbewahrungspflichten).
      </p>

      <h2>3. Bereitstellung der Website / Hosting</h2>
      <p>
        Unsere Plattform wird auf einem Server der Contabo GmbH, Aschauer Straße 32a, 81549 München,
        Deutschland, betrieben. Beim Aufruf der Website verarbeitet der Server automatisch technische
        Verbindungsdaten (u. a. IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, verwendeter
        Browser) in Server-Logfiles, um die Website auszuliefern und die IT-Sicherheit zu gewährleisten
        (Art. 6 Abs. 1 lit. f DSGVO). Diese Daten werden nicht mit anderen Datenquellen zusammengeführt.
      </p>

      <h2>4. Registrierung und Nutzerkonto</h2>
      <p>
        Zur Nutzung bestimmter Funktionen (Buchung, Einstellen von Anhängern, Nachrichten) ist ein
        Nutzerkonto erforderlich. Dabei erheben wir: Vor- und Nachname, E-Mail-Adresse, Passwort (nur als
        Hash gespeichert, nicht im Klartext), optional Telefonnummer und Profilbild. Diese Daten werden zur
        Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) verarbeitet. Der Login erfolgt über ein
        Sitzungs-Token, das in einem technisch notwendigen Cookie gespeichert wird (siehe Ziffer 9).
      </p>

      <h2>5. Einstellen von Anhängern und Standortdaten</h2>
      <p>
        Vermieter können Anhänger mit Titel, Beschreibung, Fotos, Preis und Standort (Adresse bzw.
        Geokoordinaten) einstellen. Der angegebene Standort wird zur Darstellung auf der Kartenansicht und
        zur Umkreissuche verarbeitet und ist für andere Nutzer sichtbar. Vermieter sollten daher keinen
        exakten privaten Wohnort angeben, sofern dieser nicht zugleich der Übergabeort sein soll.
      </p>

      <h2>6. Buchung und Zahlungsabwicklung</h2>
      <p>
          Raspon vermittelt den Kontakt. Für die Zahlungsabwicklung wird der Mieter auf eine gesicherte,
          von HMS Runo betriebene Raspon-Zahlungsseite unter <strong>hms-runo.de</strong> weitergeleitet.
          Dorthin werden nur eine kurzlebige Zahlungsreferenz, Buchungscode, Betrag und Währung übertragen.
          HMS Runo erstellt darüber die Zahlung beim Zahlungsdienstleister <strong>Revolut</strong>.
          Zahlungsdaten (z. B. Kartendaten) werden ausschließlich von Revolut verarbeitet und sind Raspon
          nicht zugänglich. Der Mietvertrag über den Anhänger kommt direkt zwischen Vermieter und
        Mieter zustande; Raspon inkassiert die Zahlung im Auftrag des Vermieters, behält eine
        Vermittlungsprovision ein und zahlt den Restbetrag periodisch an den Vermieter aus.
      </p>

      <h2>7. Fotos und Dokumente (Cloudflare R2)</h2>
      <p>
        Von Nutzern hochgeladene Fotos (z. B. Anhänger-Bilder, Profilbild) werden bei{" "}
        <strong>Cloudflare, Inc.</strong> (Objektspeicher „R2“) gespeichert und ausgeliefert. Dabei kann es
        zu einer Datenübermittlung in Drittländer außerhalb der EU/des EWR kommen; Cloudflare hat sich
        vertraglich zur Einhaltung der EU-Standardvertragsklauseln (Art. 46 DSGVO) verpflichtet.
      </p>

      <h2>8. SMS-Benachrichtigungen</h2>
      <p>
        Bei bestimmten Ereignissen (z. B. Buchungserstellung, Zahlungsbestätigung) versenden wir
        SMS-Benachrichtigungen über den Dienstleister <strong>MessageBird</strong>. Dabei wird Ihre
        Telefonnummer sowie der Nachrichteninhalt an MessageBird übermittelt, soweit Sie in Ihrem
        Nutzerkonto eine Telefonnummer hinterlegt haben. Ohne hinterlegte Telefonnummer werden keine SMS
        versendet.
      </p>

      <h2>9. Kommunikation zwischen Nutzern</h2>
      <p>
        Nachrichten im internen Nachrichtensystem, Buchungsanmerkungen sowie Bewertungen werden gespeichert,
        um die Kommunikation zwischen Vermieter und Mieter sowie die Nachvollziehbarkeit von Buchungen zu
        ermöglichen (Art. 6 Abs. 1 lit. b DSGVO). Bewertungen (inkl. Antworten des Vermieters) sind
        öffentlich auf der jeweiligen Anhänger-Seite sichtbar.
      </p>

      <h2>10. Kartendarstellung</h2>
      <p>
        Zur Anzeige von Standorten nutzen wir Kartenmaterial von <strong>OpenStreetMap</strong>. Beim Laden
        der Karte wird Ihre IP-Adresse an die Tile-Server von OpenStreetMap übermittelt. Weitere Hinweise:{" "}
        <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noreferrer">
          OpenStreetMap Foundation Privacy Policy
        </a>
        .
      </p>

      <h2>11. Cookies</h2>
      <p>
        Wir setzen ausschließlich ein technisch notwendiges Cookie (<code>raspon_session</code>) zur
        Aufrechterhaltung Ihrer Anmeldesitzung ein. Dieses Cookie ist zur Bereitstellung der von Ihnen
        ausdrücklich gewünschten Funktion (Login) erforderlich und bedarf gemäß § 25 Abs. 2 Nr. 2 TTDSG
        keiner gesonderten Einwilligung. Wir setzen aktuell keine Analyse-, Marketing- oder
        Tracking-Cookies ein. Sollte sich dies ändern, werden wir vorab Ihre Einwilligung einholen und diese
        Erklärung entsprechend aktualisieren. Details siehe unsere{" "}
        <a href="/cookies">Cookie-Richtlinie</a>.
      </p>

      <h2>12. Empfänger und Auftragsverarbeiter</h2>
      <p>Wir geben personenbezogene Daten an folgende Kategorien von Empfängern weiter, soweit erforderlich:</p>
      <ul>
        <li>Contabo GmbH (Hosting-Infrastruktur, Deutschland)</li>
        <li>Cloudflare, Inc. (Objektspeicher für Bilder/Dateien)</li>
          <li>HMS Runo (technische Zahlungsbrücke unter hms-runo.de)</li>
          <li>Revolut (Zahlungsabwicklung)</li>
        <li>MessageBird B.V. (Versand von SMS-Benachrichtigungen, Niederlande)</li>
      </ul>
      <p>
        Mit diesen Dienstleistern bestehen, soweit gesetzlich erforderlich, Verträge zur Auftragsverarbeitung
        gemäß Art. 28 DSGVO. Eine Weitergabe darüber hinaus erfolgt nicht, es sei denn, wir sind gesetzlich
        dazu verpflichtet.
      </p>

      <h2>13. Speicherdauer</h2>
      <p>
        Wir speichern personenbezogene Daten nur so lange, wie dies für die genannten Zwecke erforderlich
        ist oder gesetzliche Aufbewahrungsfristen (z. B. handels- und steuerrechtliche Fristen von bis zu
        10 Jahren für buchungs- und zahlungsbezogene Daten) bestehen. Nach Löschung eines Nutzerkontos
        werden nicht mehr benötigte Daten gelöscht oder anonymisiert, soweit keine Aufbewahrungspflicht
        entgegensteht.
      </p>

      <h2>14. Ihre Rechte</h2>
      <p>Ihnen stehen gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten zu:</p>
      <ul>
        <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
        <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
        <li>Recht auf Löschung (Art. 17 DSGVO)</li>
        <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>Widerspruchsrecht gegen die Verarbeitung (Art. 21 DSGVO)</li>
      </ul>
      <p>
        Zur Ausübung dieser Rechte genügt eine formlose E-Mail an kontakt@raspon.de. Sie haben zudem das
        Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.
      </p>

      <h2>15. Zuständige Aufsichtsbehörde</h2>
      <p>
        Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen
        <br />
        Kavalleriestraße 2–4, 40213 Düsseldorf
      </p>

      <h2>16. Änderung dieser Datenschutzerklärung</h2>
      <p>
        Wir passen diese Datenschutzerklärung an, sobald sich die Datenverarbeitung auf unserer Plattform
        ändert (z. B. bei Einführung neuer Funktionen wie Analyse-Tools oder SMS-Benachrichtigungen). Es
        gilt jeweils die zum Zeitpunkt Ihres Besuchs aktuelle Fassung.
      </p>
    </LegalPageLayout>
  );
}
