import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Widerrufsbelehrung" };

export default function WiderrufPage() {
  return (
    <LegalPageLayout title="Widerrufsbelehrung" updated="Juli 2026">
      <h2>Für wen gilt diese Widerrufsbelehrung?</h2>
      <p>
        Ein gesetzliches Widerrufsrecht nach §§ 312g, 355 BGB besteht nur bei Verträgen zwischen einem
        Unternehmer und einem Verbraucher. Ist der Vermieter eines Anhängers bei Raspon selbst Verbraucher
        (private Vermietung, keine gewerbliche Tätigkeit), besteht für den Mietvertrag zwischen Vermieter
        und Mieter kein gesetzliches Widerrufsrecht. Die nachfolgende Belehrung gilt daher nur, soweit der
        Vermieter als Unternehmer im Sinne des § 14 BGB handelt.
      </p>

      <h2>Widerrufsrecht</h2>
      <p>
        Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
      </p>
      <p>
        Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses. Um Ihr Widerrufsrecht
        auszuüben, müssen Sie den Vermieter des gebuchten Anhängers oder uns (HMS Runo, Inhaber Marcin Runo,
        Doomerstraße 4, 47877 Willich, E-Mail: kontakt@raspon.de) mittels einer eindeutigen Erklärung (z. B.
        ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu
        widerrufen, informieren. Sie können dafür das unten stehende Muster-Widerrufsformular verwenden,
        was jedoch nicht vorgeschrieben ist.
      </p>
      <p>
        Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des
        Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
      </p>

      <h2>Folgen des Widerrufs</h2>
      <p>
        Wenn Sie diesen Vertrag widerrufen, erstatten wir Ihnen alle Zahlungen, die wir von Ihnen erhalten
        haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurück, an dem die Mitteilung
        über Ihren Widerruf bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe
        Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen
        wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung
        Entgelte berechnet.
      </p>
      <p>
        Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so haben Sie
        uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von
        der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten
        Leistung entspricht.
      </p>

      <h2>Erlöschen des Widerrufsrechts</h2>
      <p>
        Das Widerrufsrecht erlischt vorzeitig bei Verträgen zur Erbringung von Dienstleistungen im
        Zusammenhang mit Freizeitgestaltung, wenn der Vertrag für die Erbringung einen bestimmten Termin
        oder Zeitraum vorsieht (§ 312g Abs. 2 Nr. 9 BGB) – etwa wenn der Mietzeitraum bereits begonnen hat
        oder unmittelbar bevorsteht und Sie der sofortigen Ausführung ausdrücklich zugestimmt haben.
      </p>

      <hr />

      <h2>Muster-Widerrufsformular</h2>
      <p>
        (Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es
        zurück.)
      </p>
      <p>
        An: HMS Runo, Inhaber Marcin Runo, Doomerstraße 4, 47877 Willich, E-Mail: kontakt@raspon.de
        <br />
        <br />
        Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Buchung des
        folgenden Anhängers / die Erbringung der folgenden Dienstleistung (*):
        <br />
        <br />
        Bestellt am (*) / erhalten am (*): _______________________
        <br />
        Name des/der Verbraucher(s): _______________________
        <br />
        Anschrift des/der Verbraucher(s): _______________________
        <br />
        Buchungsnummer: _______________________
        <br />
        <br />
        Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)
        <br />
        Datum: _______________________
        <br />
        <br />
        (*) Unzutreffendes streichen.
      </p>
    </LegalPageLayout>
  );
}
