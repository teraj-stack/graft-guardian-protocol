import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cartStore";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } =
    useCartStore();

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? "PLN";

  useEffect(() => {
    if (open) syncCart();
  }, [open, syncCart]);

  const handleCheckout = () => {
    const url = getCheckoutUrl();
    if (url) {
      window.open(url, "_blank");
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Otwórz koszyk"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border/60 text-foreground transition hover:bg-foreground/5"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-foreground">
            {totalItems}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="flex h-full w-full max-w-md flex-col border-l border-border/60 bg-background">
            <header className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h2 className="font-serif text-xl text-foreground">Koszyk</h2>
                <p className="text-xs text-muted-foreground">
                  {totalItems === 0
                    ? "Twój koszyk jest pusty"
                    : `${totalItems} ${totalItems === 1 ? "pozycja" : "pozycji"}`}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Zamknij"
                className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border/60 text-foreground"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <p className="mt-12 text-center text-sm text-muted-foreground">
                  Dodaj produkty z naszego sklepu, aby kontynuować.
                </p>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={item.variantId} className="flex gap-3 border-b border-border/40 pb-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-sm bg-secondary/30">
                        {item.product.node.images?.edges?.[0]?.node?.url && (
                          <img
                            src={item.product.node.images.edges[0].node.url}
                            alt={item.product.node.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{item.product.node.title}</p>
                        {item.selectedOptions.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.selectedOptions.map((o) => o.value).join(" • ")}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {parseFloat(item.price.amount).toFixed(2)} {item.price.currencyCode}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="h-7 w-7 rounded-sm border border-border/60 text-sm"
                            aria-label="Zmniejsz ilość"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="h-7 w-7 rounded-sm border border-border/60 text-sm"
                            aria-label="Zwiększ ilość"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(item.variantId)}
                            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                          >
                            Usuń
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-border/60 bg-background px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Razem</span>
                  <span className="font-serif text-xl text-foreground">
                    {totalPrice.toFixed(2)} {currency}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isLoading || isSyncing}
                  className="w-full rounded-sm bg-foreground px-4 py-3 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:opacity-50"
                >
                  {isLoading || isSyncing ? "Synchronizacja…" : "Przejdź do kasy"}
                </button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Płatność obsługiwana przez Shopify Checkout
                </p>
              </footer>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
