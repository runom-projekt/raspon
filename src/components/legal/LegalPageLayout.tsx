import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface LegalPageLayoutProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, updated, children }: LegalPageLayoutProps) {
  return (
    <>
      <Header />
      <main className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-2xl font-bold text-graphite-900 sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-graphite-500">Stand: {updated}</p>
          <div className="prose prose-sm mt-8 max-w-none prose-headings:font-display prose-headings:text-graphite-900 prose-a:text-accent-600">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
