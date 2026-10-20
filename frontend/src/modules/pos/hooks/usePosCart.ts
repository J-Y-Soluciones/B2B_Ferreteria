import { useState, useCallback } from "react";
import type { CartItem } from "../models/pos.types";
import type { CatalogProduct } from "@/modules/catalog/models/catalog.types";

export function usePosCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItemFromCatalog = useCallback((product: CatalogProduct) => {
    setItems((currentItems) => {
      // Determinación unívoca de línea: separa ventas por unidad base de presentaciones secundarias
      const activeConversionId =
        product.matchedConversion?.conversionId ?? null;
      const itemId = activeConversionId
        ? `${product.productId}-${activeConversionId}`
        : `${product.productId}-BASE`;

      const exists = currentItems.some((item) => item.id === itemId);

      const resolvedPrice =
        product.matchedConversion?.salePrice ?? product.baseSalePrice ?? 0;

      const conversionRate = product.matchedConversion?.conversionRate ?? 1;
      const presentationName = product.matchedConversion
        ? `${product.matchedConversion.presentationName} (x${conversionRate})`
        : `${product.baseUnit} (x1)`;

      if (exists) {
        return currentItems.map((item) => {
          if (item.id === itemId) {
            const nextQty = item.quantity + 1;
            return {
              ...item,
              quantity: nextQty,
              subtotal: Number((nextQty * item.unitPrice).toFixed(2)),
            };
          }
          return item;
        });
      }

      const newItem: CartItem = {
        id: itemId,
        productId: product.productId,
        name: product.name,
        conversionId: activeConversionId, // Garantiza el UUID real hacia el backend
        presentationName,
        conversionRate,
        unitPrice: resolvedPrice,
        quantity: 1,
        subtotal: resolvedPrice,
        isService: product.isService,
        baseUnit: product.baseUnit,
        stockAvailable: product.stockAvailable,
      };

      return [...currentItems, newItem];
    });
  }, []);

  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    setItems((currentItems) => {
      if (quantity <= 0) {
        return currentItems.filter((item) => item.id !== id);
      }
      return currentItems.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantity,
            subtotal: Number((quantity * item.unitPrice).toFixed(2)),
          };
        }
        return item;
      });
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const cartTotal = Number(
    items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2),
  );

  return {
    items,
    addItemFromCatalog,
    updateItemQuantity,
    removeItem,
    clearCart,
    cartTotal,
  };
}
