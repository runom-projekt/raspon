import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Cookie-Richtlinie" };

export default function CookiesPage() {
  return (
    <LegalPageLayout title="Cookie-Richtlinie" updated="Juli 2026">
      <h2>Welche Cookies verwenden wir?</h2>
      <p>
        Raspon verwendet ausschließlich ein technisch notwendiges Cookie:
      </p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Zweck</th>
            <th>Speicherdauer</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>raspon_session</code>
            </td>
            <td>Speichert Ihre Anmeldesitzung, damit Sie eingeloggt bleiben.</td>
            <td>30 Tage bzw. bis zum Logout</td>
          </tr>
        </tbody>
      </table>
      <p>
        Dieses Cookie ist erforderlich, um die von Ihnen ausdrücklich angeforderte Funktion (Login und
        Nutzung Ihres Kontos) bereitzustellen. Es fällt daher unter die Ausnahme des § 25 Abs. 2 Nr. 2
        TTDSG und benötigt keine gesonderte Einwilligung – es wird deshalb kein Cookie-Consent-Banner
        eingeblendet.
      </p>

      <h2>Keine Analyse- oder Marketing-Cookies</h2>
      <p>
        Wir setzen derzeit keine Analyse-, Tracking- oder Marketing-Cookies und keine
        Drittanbieter-Werbedienste ein. Sollten wir künftig solche Dienste einsetzen, werden wir zuvor Ihre
        Einwilligung über ein Cookie-Consent-Banner einholen und diese Seite entsprechend aktualisieren.
      </p>

      <h2>Karten und externe Inhalte</h2>
      <p>
        Beim Einblenden von Kartenausschnitten (OpenStreetMap) wird Ihre IP-Adresse an den jeweiligen
        Kartenanbieter übermittelt. Es werden dabei keine Cookies gesetzt. Details finden Sie in unserer{" "}
        <a href="/datenschutz">Datenschutzerklärung</a>.
      </p>
    </LegalPageLayout>
  );
}
