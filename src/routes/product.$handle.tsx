import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { Clock, Package, CheckCircle } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import {
  STOREFRONT_PRODUCT_BY_HANDLE_QUERY,
  storefrontApiRequest,
} from "@/lib/shopify";

export const Route = createFileRoute("/product/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} — Sklep Graftgen` },
      { name: "description", content: "Produkt sklepu Graftgen — pielęgnacja po przeszczepie." },
    ],
  }),
  component: ProductPage,
});

async function fetchProduct(handle: string) {
  const data = await storefrontApiRequest(STOREFRONT_PRODUCT_BY_HANDLE_QUERY, { handle });
  return data?.data?.product ?? null;
}

function ProductPage() {
  const { handle } = useParams({ from: "/product/$handle" });
  const { data: product, isLoading } = useQuery({
    queryKey: ["shopify", "product", handle],
    queryFn: () => fetchProduct(handle),
  });

  const addItem = useCartStore((s) => s.addItem);
  const isAdding = useCartStore((s) => s.isLoading);
  const [variantId, setVariantId] = useState<string | null>(null);

  const variants = product?.variants?.edges ?? [];
  const currentVariant = useMemo(() => {
    if (!variants.length) return null;
    return (variants.find((v: { node: { id: string } }) => v.node.id === variantId) ?? variants[0]).node;
  }, [variants, variantId]);

  const onAdd = async () => {
    if (!currentVariant || !product) return;
    await addItem({
      product: { node: product },
      variantId: currentVariant.id,
      variantTitle: currentVariant.title,
      price: currentVariant.price,
      quantity: 1,
      selectedOptions: currentVariant.selectedOptions ?? [],
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/sklep" className="font-serif text-lg">← Sklep</Link>
          <CartDrawer />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {isLoading && <p className="text-sm text-muted-foreground">Ładowanie…</p>}
        {!isLoading && !product && (
          <p className="text-sm text-muted-foreground">Produkt nie został znaleziony.</p>
        )}
        {product && (
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="overflow-hidden rounded-sm bg-secondary/30">
              {product.images?.edges?.[0]?.node?.url ? (
                <img
                  src={product.images.edges[0].node.url}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-muted-foreground">—</div>
              )}
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl">{product.title}</h1>
              <p className="mt-4 text-xl font-semibold">
                {currentVariant
                  ? `${parseFloat(currentVariant.price.amount).toFixed(2)} ${currentVariant.price.currencyCode}`
                  : `${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)} ${product.priceRange.minVariantPrice.currencyCode}`}
              </p>
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>

              {variants.length > 1 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Wariant</p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v: { node: { id: string; title: string; availableForSale: boolean } }) => {
                      const active = (currentVariant?.id ?? variants[0].node.id) === v.node.id;
                      return (
                        <button
                          key={v.node.id}
                          onClick={() => setVariantId(v.node.id)}
                          disabled={!v.node.availableForSale}
                          className={`rounded-sm border px-3 py-2 text-sm transition ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border/60 text-foreground hover:border-accent"
                          } ${!v.node.availableForSale ? "opacity-40" : ""}`}
                        >
                          {v.node.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={onAdd}
                disabled={!currentVariant?.availableForSale || isAdding}
                className="mt-8 inline-flex w-full items-center justify-center rounded-sm bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:opacity-50 sm:w-auto"
              >
                {isAdding ? "Dodaję…" : currentVariant?.availableForSale ? "Dodaj do koszyka" : "Niedostępny"}
              </button>
            </div>
          </div>
        )}
      </section>

      {product && <SessionPlans product={product} currentVariant={currentVariant} />}
    </div>
  );
interface SessionPlan {
  sessions: number;
  label: string;
  frequency: string;
  timeline: string;
  bestFor: string;
}

function getProtocolData(title: string): { plans: SessionPlan[]; note: string } {
  const t = title.toLowerCase();
  if (t.includes("hiperbaryczn") || t.includes("hbot")) {
    return {
      plans: [
        { sessions: 5, label: "Pakiet startowy", frequency: "1 sesja / 2–3 dni", timeline: "Ok. 2 tygodnie", bestFor: "Małe–średnie przeszczepy, profilaktyka" },
        { sessions: 10, label: "Pakiet standardowy", frequency: "1 sesja / 2 dni", timeline: "Ok. 3 tygodnie", bestFor: "Standardowa regeneracja po DHI" },
        { sessions: 20, label: "Pakiet intensywny", frequency: "1 sesja / dzień", timeline: "4 tygodnie", bestFor: "Duże przeszczepy (>3000 graftów), palacze, cukrzyca" },
      ],
      note: "Pierwsza sesja najlepiej w oknie 24–48 h po zabiegu. Kwalifikacja lekarska wymagana.",
    };
  }
  if (t.includes("plazm") || t.includes("cap") || t.includes("cold plasma")) {
    return {
      plans: [
        { sessions: 5, label: "Seria wstępna", frequency: "1 sesja / 2–3 tygodnie", timeline: "3 miesiące", bestFor: "Ostrożne wprowadzenie, skóra wrażliwa" },
        { sessions: 10, label: "Seria pełna", frequency: "1 sesja / 2 tygodnie", timeline: "5 miesięcy", bestFor: "Standardowy protokół po DHI z CAP" },
        { sessions: 20, label: "Seria intensywna", frequency: "1 sesja / 1–2 tygodnie", timeline: "6–8 miesięcy", bestFor: "Zaawansowana regeneracja, wcześniejsze nieudane próby" },
      ],
      note: "Pierwsza sesja optymalnie 3–4 tygodnie po przeszczepie. Konieczna kwalifikacja trychologiczna.",
    };
  }
  if (t.includes("fototerap") || t.includes("pbm") || t.includes("lllt") || t.includes("led")) {
    return {
      plans: [
        { sessions: 5, label: "Pakiet próbny", frequency: "2–3× / tydzień", timeline: "2 tygodnie", bestFor: "Weryfikacja tolerancji światła" },
        { sessions: 10, label: "Pakiet startowy", frequency: "2–3× / tydzień", timeline: "1 miesiąc", bestFor: "Wczesna faza po DHI (od 7. dnia)" },
        { sessions: 20, label: "Pakiet pełny", frequency: "2–3× / tydzień", timeline: "2 miesiące", bestFor: "Standardowy cykl 12–16 tygodni (zachowane do uzupełnienia)" },
      ],
      note: "PBM to terapia wspomagająca — efekty widoczne zazwyczaj po 12–16 tygodniach regularnej ekspozycji.",
    };
  }
  // Default: LADD tulowy / laser
  return {
    plans: [
      { sessions: 5, label: "Seria wstępna", frequency: "1 sesja / 3–4 tygodnie", timeline: "5 miesięcy", bestFor: "Profilaktyka, skóra bez istotnych zmian" },
      { sessions: 10, label: "Seria pełna", frequency: "1 sesja / 3–4 tygodnie", timeline: "9–10 miesięcy", bestFor: "Standardowy protokół po DHI z LADD/PRP" },
      { sessions: 20, label: "Seria intensywna", frequency: "1 sesja / 3 tygodnie", timeline: "14 miesięcy", bestFor: "Wieloetapowa regeneracja, przewlekłe wypadanie" },
    ],
    note: "Optymalne okno: 4–6 tygodni po przeszczepie. Seria 4–6 sesji to minimum; 10–20 to pełny cykl.",
  };
}

function SessionPlans({ product, currentVariant }: { product: any; currentVariant: any }) {
  const { plans, note } = getProtocolData(product.title ?? "");

  const variants = useMemo(() => {
    const list = product?.variants?.edges ?? [];
    return list.map((v: any) => v.node).sort((a: any, b: any) => {
      const na = parseInt(a.title.match(/\d+/)?.[0] ?? "0", 10);
      const nb = parseInt(b.title.match(/\d+/)?.[0] ?? "0", 10);
      return na - nb;
    });
  }, [product]);

  const variantMap = useMemo(() => {
    const map: Record<number, any> = {};
    for (const v of variants) {
      const n = parseInt(v.title.match(/\d+/)?.[0] ?? "0", 10);
      if (n) map[n] = v;
    }
    return map;
  }, [variants]);

  const pricePerSession = (variant: any) => {
    const n = parseInt(variant.title.match(/\d+/)?.[0] ?? "1", 10);
    const amount = parseFloat(variant.price.amount);
    return (amount / n).toFixed(2);
  };

  const priceRange = useMemo(() => {
    const prices = variants.map((v: any) => parseFloat(v.price.amount));
    if (!prices.length) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min: min.toFixed(2), max: max.toFixed(2), currency: variants[0]?.price?.currencyCode ?? "PLN" };
  }, [variants]);

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="rounded-sm border border-border/60 bg-card p-6 md:p-10">
        <h2 className="font-serif text-2xl md:text-3xl">Ile sesji zwykle potrzeba?</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Poniżej przykładowe plany terapeutyczne oparte na protokole Graftgen. Wybór zależy od zakresu przeszczepu, historii medycznej i celu.
        </p>

        {priceRange && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-sm bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            Przedział cenowy: {priceRange.min} – {priceRange.max} {priceRange.currency}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const variant = variantMap[plan.sessions];
            const isSelected = currentVariant?.id === variant?.id;
            return (
              <div
                key={plan.sessions}
                className={`relative flex flex-col rounded-sm border p-5 transition ${
                  isSelected ? "border-foreground bg-foreground/5" : "border-border/60 bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-3xl">{plan.sessions}</span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">{plan.label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">sesji</p>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{plan.frequency}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{plan.timeline}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{plan.bestFor}</span>
                  </div>
                </div>

                {variant && (
                  <div className="mt-5 border-t border-border/40 pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">
                        {parseFloat(variant.price.amount).toFixed(2)} {variant.price.currencyCode}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ~{pricePerSession(variant)} {variant.price.currencyCode} / sesja
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          {note}
        </p>
      </div>
    </section>
  );
}


