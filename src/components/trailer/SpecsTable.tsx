interface SpecsTableProps {
  manufacturer?: string | null;
  model?: string | null;
  productionYear?: number | null;
  weightKg?: number | null;
  grossWeightKg?: number | null;
  payloadKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
}

export function SpecsTable(props: SpecsTableProps) {
  const rows: [string, string | number | null | undefined][] = [
    ["Hersteller", props.manufacturer],
    ["Modell", props.model],
    ["Baujahr", props.productionYear],
    ["Leergewicht", props.weightKg ? `${props.weightKg} kg` : null],
    ["Zulässiges Gesamtgewicht", props.grossWeightKg ? `${props.grossWeightKg} kg` : null],
    ["Nutzlast", props.payloadKg ? `${props.payloadKg} kg` : null],
    [
      "Abmessungen (L × B × H)",
      props.lengthCm && props.widthCm && props.heightCm
        ? `${props.lengthCm / 100} × ${props.widthCm / 100} × ${props.heightCm / 100} m`
        : null,
    ],
  ].filter((row): row is [string, string | number] => row[1] !== null && row[1] !== undefined);

  if (rows.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-3 rounded-2xl border border-graphite-100 p-6 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between border-b border-graphite-50 pb-2 sm:justify-start sm:gap-3">
          <dt className="text-sm text-graphite-500">{label}</dt>
          <dd className="text-sm font-semibold text-graphite-900">{value}</dd>
        </div>
      ))}
    </div>
  );
}
