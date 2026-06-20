import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { formatMoney } from "@/lib/utils";
import { CartDrawer } from "@/components/CartDrawer";
import mscLogo from "@/assets/msc-logo.jpeg.asset.json";
import graftgenLogo from "@/assets/graftgen-logo.jpg.asset.json";
import {
  STOREFRONT_PRODUCTS_QUERY,
  storefrontApiRequest,
  type ShopifyProduct,
} from "@/lib/shopify";
import { PRICING, PRICING_FAQ } from "@/lib/pricing-data";


const TITLE = "Sklep — kosmetyki i akcesoria po przeszczepie włosów";
const DESCRIPTION =
  "Pakiety domowej pielęgnacji, szampony post-DHI, akcesoria do PBM i mikrobiomu skóry głowy. Wysyłka z Polski.";

export const Route = createFileRoute("/sklep")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "https://graft-guardian-protocol.lovable.app/sklep" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://graft-guardian-protocol.lovable.app/sklep" }],
  }),
  component: Shop,
});

async function fetchProducts(): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 50, query: null });
  return (data?.data?.products?.edges ?? []) as ShopifyProduct[];
}

function Shop() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["shopify", "products"],
    queryFn: fetchProducts,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-serif text-lg text-foreground">
            ← Graftgen.com
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Strona główna
            </Link>
            <CartDrawer />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Sklep</p>
        <h1 className="mt-3 font-serif text-4xl text-foreground md:text-5xl">
          Pielęgnacja po przeszczepie — produkty kliniczne.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Wybrane preparaty i akcesoria, których używamy w protokole. Wszystkie produkty wysyłane
          bezpośrednio ze sklepu Graftgen.com
        </p>

        <div className="mt-12">
          {isLoading && <p className="text-sm text-muted-foreground">Ładowanie produktów…</p>}
          {error && (
            <p className="text-sm text-red-500">
              Nie udało się pobrać produktów. Spróbuj odświeżyć stronę.
            </p>
          )}
          {data && data.length === 0 && (
            <div className="rounded-sm border border-dashed border-border/60 px-6 py-16 text-center">
              <p className="font-serif text-2xl text-foreground">No products found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Sklep jest gotowy, ale nie ma jeszcze żadnych produktów. Wkrótce pojawią się pakiety
                pielęgnacyjne.
              </p>
            </div>
          )}
          {data && data.length > 0 && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((p) => (
                <ProductCard key={p.node.id} product={p} />
              ))}
            </div>
          )}
        </div>

        <PricingSummary products={data ?? []} />
        <PricingFaq />
      </section>
    </div>
  );
}

interface CompareInfo {
  formattedCap: string | null;
  discountPct: number | null;
}

type CompareLookup = Record<string, Record<number, CompareInfo>>;

function buildCompareLookup(products: ShopifyProduct[]): CompareLookup {
  const lookup: CompareLookup = {};
  for (const edge of products) {
    const handle = edge.node.handle;
    const byCount: Record<number, CompareInfo> = {};
    for (const v of edge.node.variants.edges) {
      const sessions = parseInt(v.node.title?.match(/\d+/)?.[0] ?? "0", 10) || 1;
      const cap = v.node.compareAtPrice;
      const price = Number(v.node.price.amount);
      if (cap?.amount && Number(cap.amount) > price) {
        const capNum = Number(cap.amount);
        const pct = Math.round(((capNum - price) / capNum) * 100);
        const n = Math.round(capNum);
        byCount[sessions] = {
          formattedCap: `${n.toLocaleString("pl-PL")} ${cap.currencyCode === "PLN" ? "zł" : cap.currencyCode}`,
          discountPct: pct,
        };
      } else if (!(sessions in byCount)) {
        byCount[sessions] = { formattedCap: null, discountPct: null };
      }
    }
    lookup[handle] = byCount;
  }
  return lookup;
}

function PricingSummary({ products }: { products: ShopifyProduct[] }) {
  const compare = buildCompareLookup(products);
  return (
    <div id="cennik" className="mt-24 border-t border-border/60 pt-14">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Cennik</p>
      <h2 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">
        Pakiety 1 / 5 / 10 / 20 sesji.
      </h2>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Ceny uśrednione na podstawie górnego przedziału stawek klinik premium
        w Warszawie i Gdańsku (stan: 2026). Kolumny <em>katalog</em> pokazują
        cenę przed rabatem (compareAtPrice z Shopify).
      </p>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-3 pr-4">Zabieg</th>
              <th className="py-3 pr-4 text-right">1 sesja</th>
              <th className="py-3 pr-4 text-right">Katalog</th>
              <th className="py-3 pr-4 text-right">Pakiet 5</th>
              <th className="py-3 pr-4 text-right">Katalog 5</th>
              <th className="py-3 pr-4 text-right">Pakiet 10</th>
              <th className="py-3 pr-4 text-right">Katalog 10</th>
              <th className="py-3 pr-4 text-right">Pakiet 20</th>
              <th className="py-3 pr-4 text-right">Katalog 20</th>
              <th className="py-3 text-right" />
            </tr>
          </thead>
          <tbody>
            {PRICING.map((p) => {
              const cap = compare[p.handle] ?? {};
              const renderCap = (n: number) =>
                cap[n]?.formattedCap ? (
                  <span className="text-[12px] text-muted-foreground line-through">{cap[n].formattedCap}</span>
                ) : (
                  <span className="text-[12px] text-muted-foreground/50">—</span>
                );
              const discountBadge = (n: number) => {
                const info = cap[n];
                if (!info?.discountPct) return null;
                return (
                  <span className="ml-1.5 inline-flex items-center rounded-sm bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                    −{info.discountPct}%
                  </span>
                );
              };
              return (
                <tr key={p.code} className="border-b border-border/40">
                  <td className="py-4 pr-4">
                    <div className="font-medium text-foreground">{p.name}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {p.code} · {p.params}
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-right text-foreground">
                    <span>{p.single.price}</span>
                    {discountBadge(1)}
                  </td>
                  <td className="py-4 pr-4 text-right">{renderCap(1)}</td>
                  {p.packs.flatMap((pk) => [
                    <td key={`${pk.sessions}-p`} className="py-4 pr-4 text-right">
                      <div className="text-foreground">
                        <span>{pk.price}</span>
                        {discountBadge(pk.sessions)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {pk.unitPrice}/sesja · −{pk.saving}
                      </div>
                    </td>,
                    <td key={`${pk.sessions}-c`} className="py-4 pr-4 text-right">
                      {renderCap(pk.sessions)}
                    </td>,
                  ])}
                  <td className="py-4 text-right">
                    <Link
                      to="/product/$handle"
                      params={{ handle: p.handle }}
                      className="text-xs text-accent hover:underline"
                    >
                      Kup →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function PricingFaq() {
  return (
    <div className="mt-20 border-t border-border/60 pt-14">
      <h2 className="font-serif text-3xl text-foreground md:text-4xl">
        Pytania o pakiety i rozliczenia
      </h2>
      <div className="mt-8 divide-y divide-border border-y border-border">
        {PRICING_FAQ.map((f) => (
          <details key={f.q} className="group py-6">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
              <h3 className="font-serif text-lg text-foreground md:text-xl">{f.q}</h3>
              <span className="mt-2 shrink-0 font-serif text-2xl text-accent transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

function productPlaceholder(product: ShopifyProduct) {
  const t = product.node.title.toLowerCase();
  if (t.includes("hiperbaryczn") || t.includes("hbot") || t.includes("fototerap") || t.includes("pbm") || t.includes("lllt")) {
    return { src: graftgenLogo.url, alt: "Graftgen.com" };
  }
  if (t.includes("ladd") || t.includes("plazm") || t.includes("cap") || t.includes("tul")) {
    return { src: mscLogo.url, alt: "MSC" };
  }
  return { src: graftgenLogo.url, alt: "Graftgen.com" };
}

function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const variant = product.node.variants.edges[0]?.node;
  const img = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;
  const placeholder = productPlaceholder(product);

  const onAdd = async () => {
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions ?? [],
    });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-sm border border-border/60 bg-card transition hover:border-accent/60">
      <Link to="/product/$handle" params={{ handle: product.node.handle }} className="block">
        <div className="aspect-square overflow-hidden bg-secondary/30">
          {img ? (
            <img
              src={img.url}
              alt={img.altText ?? product.node.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-8">
              <img
                src={placeholder.src}
                alt={placeholder.alt}
                className="max-h-full max-w-full object-contain opacity-90 transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
          )}

        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link to="/product/$handle" params={{ handle: product.node.handle }}>
          <h3 className="font-serif text-lg text-foreground hover:text-accent">{product.node.title}</h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.node.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">
            {formatMoney(parseFloat(price.amount))} {price.currencyCode}
          </span>
          <button
            onClick={onAdd}
            disabled={!variant || !variant.availableForSale || isLoading}
            className="rounded-sm bg-foreground px-3 py-2 text-xs font-medium text-background transition hover:bg-foreground/90 disabled:opacity-50"
          >
            {!variant?.availableForSale ? "Niedostępny" : "Do koszyka"}
          </button>
        </div>
      </div>
    </article>
  );
}
