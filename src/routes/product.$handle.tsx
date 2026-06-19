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
    </div>
  );
}
