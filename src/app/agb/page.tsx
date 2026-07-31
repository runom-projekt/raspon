import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "AGB" };

export default function AgbPage() {
  return (
    <LegalPageLayout title="Allgemeine Geschäftsbedingungen" updated="Juli 2026">
      <h2>§ 1 Geltungsbereich und Vertragspartner</h2>
      <p>
        Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Online-Plattform raspon.de
        (nachfolgend „Raspon“ oder „Plattform“), betrieben von HMS Runo, Inhaber Marcin Runo, Doomerstraße 4,
        47877 Willich (nachfolgend „Betreiber“). Sie gelten für alle Nutzer der Plattform, unabhängig davon,
        ob sie Anhänger einstellen („Vermieter“) oder mieten möchten („Mieter“).
      </p>

      <h2>§ 2 Leistungsbeschreibung</h2>
      <p>
        Raspon ist eine Vermittlungsplattform. Der Betreiber stellt die technische Infrastruktur zur
        Verfügung, über die Vermieter Anhänger inserieren und Mieter diese buchen und bezahlen können. Der
        Mietvertrag über den jeweiligen Anhänger kommt ausschließlich unmittelbar zwischen Vermieter und
        Mieter zustande. Der Betreiber wird nicht selbst Vertragspartei des Mietvertrags und übernimmt keine
        Vermieterpflichten.
      </p>

      <h2>§ 3 Registrierung und Nutzerkonto</h2>
      <p>
        Die Nutzung der Plattform setzt eine Registrierung voraus. Registrieren dürfen sich nur
        geschäftsfähige, mindestens 18 Jahre alte Personen. Bei der Registrierung sind wahrheitsgemäße
        Angaben zu machen und aktuell zu halten. Zugangsdaten sind vertraulich zu behandeln; für Handlungen
        unter dem eigenen Account haftet der jeweilige Nutzer, sofern er den Missbrauch zu vertreten hat.
      </p>

      <h2>§ 4 Einstellen von Anhängern durch Vermieter</h2>
      <p>Vermieter sichern zu, dass:</p>
      <ul>
        <li>alle Angaben zum Anhänger (Zustand, Ausstattung, Maße, Gewicht, Preis) wahrheitsgemäß sind;</li>
        <li>der Anhänger verkehrssicher, ordnungsgemäß versichert und – soweit erforderlich – TÜV-geprüft ist;</li>
        <li>sie zur Vermietung des Anhängers berechtigt sind (Eigentum oder Verfügungsbefugnis).</li>
      </ul>
      <p>
        Der Betreiber prüft eingestellte Anzeigen vor Veröffentlichung stichprobenartig, übernimmt jedoch
        keine Gewähr für die Richtigkeit der Angaben der Vermieter.
      </p>

      <h2>§ 5 Buchungsvorgang</h2>
      <p>
        Ein Mietvertrag kommt zustande, sobald der Mieter eine Buchungsanfrage stellt und die Zahlung
        erfolgreich über die Plattform autorisiert wurde. Übergabe- und Rückgabemodalitäten vereinbaren
        Vermieter und Mieter eigenverantwortlich, soweit die Anzeige keine abweichenden Angaben enthält.
      </p>

      <h2>§ 6 Preise, Provision und Zahlungsabwicklung</h2>
      <p>
        Die Miete zahlt der Mieter vollständig im Voraus über die Plattform an den Betreiber, der die
        Zahlung über den Zahlungsdienstleister Revolut im Auftrag des Vermieters einzieht. Der Betreiber
        behält hiervon eine Vermittlungsprovision in der bei der jeweiligen Anzeige ausgewiesenen Höhe
        (derzeit 15 % des Mietpreises) ein und zahlt den Restbetrag periodisch an den Vermieter aus. Eine
        vom Vermieter verlangte Kaution wird gesondert ausgewiesen und nach Rückgabe des Anhängers
        abzüglich etwaiger Schäden zurückerstattet.
      </p>

      <h2>§ 7 Stornierung</h2>
      <p>
        Die für die jeweilige Buchung geltenden Stornierungsbedingungen werden dem Mieter vor Zahlung
        angezeigt. Gesetzliche Rücktritts- und Kündigungsrechte beider Vertragsparteien des Mietvertrags
        bleiben hiervon unberührt. Hinweise zu einem etwaigen Widerrufsrecht finden sich in der{" "}
        <a href="/widerruf">Widerrufsbelehrung</a>.
      </p>

      <h2>§ 8 Pflichten des Mieters</h2>
      <p>
        Der Mieter verpflichtet sich, den Anhänger sorgfältig zu behandeln, ausschließlich mit einem dafür
        geeigneten und zulässig ausgestatteten Zugfahrzeug zu nutzen, geltende Verkehrsvorschriften
        (insbesondere zulässige Anhängelast und erforderliche Führerscheinklasse) einzuhalten und den
        Anhänger fristgerecht im vereinbarten Zustand zurückzugeben.
      </p>

      <h2>§ 9 Haftung</h2>
      <p>
        Der Betreiber haftet nur für Vorsatz und grobe Fahrlässigkeit sowie nach Maßgabe des
        Produkthaftungsgesetzes, nicht jedoch für Schäden im Zusammenhang mit dem Zustand, der
        Verkehrssicherheit oder der Nutzung eines über die Plattform gebuchten Anhängers – diese
        Verantwortung liegt bei Vermieter und Mieter im Rahmen ihres Mietvertrags. Bei einfacher
        Fahrlässigkeit haftet der Betreiber nur bei Verletzung wesentlicher Vertragspflichten
        (Kardinalpflichten) und begrenzt auf den vorhersehbaren, vertragstypischen Schaden. Die Haftung für
        Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit bleibt unberührt.
      </p>

      <h2>§ 10 Bewertungen</h2>
      <p>
        Nach Abschluss einer Buchung können Nutzer eine Bewertung abgeben. Bewertungen müssen wahrheitsgemäß
        sein, auf eigenen Erfahrungen beruhen und dürfen keine beleidigenden, diskriminierenden oder
        rechtswidrigen Inhalte enthalten. Der Betreiber behält sich vor, gegen diese Regeln verstoßende
        Bewertungen zu entfernen.
      </p>

      <h2>§ 11 Sperrung von Nutzerkonten</h2>
      <p>
        Bei Verstößen gegen diese AGB, gegen geltendes Recht oder bei begründetem Verdacht auf Missbrauch
        kann der Betreiber Anzeigen entfernen oder Nutzerkonten vorübergehend sperren oder kündigen.
      </p>

      <h2>§ 12 Schlussbestimmungen</h2>
      <p>
        Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Zwingende
        verbraucherschützende Bestimmungen des Staates, in dem ein Verbraucher seinen gewöhnlichen
        Aufenthalt hat, bleiben unberührt. Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die
        Wirksamkeit der übrigen Bestimmungen unberührt.
      </p>
    </LegalPageLayout>
  );
}
