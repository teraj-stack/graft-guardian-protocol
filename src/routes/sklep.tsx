import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { formatMoney } from "@/lib/utils";
import { CartDrawer } from "@/components/CartDrawer";
import {
  STOREFRONT_PRODUCTS_QUERY,
  storefrontApiRequest,
  type ShopifyProduct,
} from "@/lib/shopify";

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
            ← Graftgen
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
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const variant = product.node.variants.edges[0]?.node;
  const img = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;

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
            <div className="flex h-full items-center justify-center text-muted-foreground">—</div>
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
