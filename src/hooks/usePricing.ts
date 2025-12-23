import { useMemo } from 'react';
import { PaywallProduct, PaymentCurrency } from '../types';
import { kopecksToStars } from '../utils/price';

interface UsePricingProps {
  products: PaywallProduct[];
  selectedCurrency: PaymentCurrency;
}

export const usePricing = ({ products, selectedCurrency }: UsePricingProps) => {
  const productsWithCalculatedPrices = useMemo(() => {
    return products.map(product => {
      // If we already have prices in stars from backend, use them
      if (product.priceInStars && product.originalPriceInStars && product.monthlyEquivalentInStars) {
        return product;
      }

      // Otherwise, calculate prices in stars from rubles
      const priceInStars = product.priceInStars || kopecksToStars(product.price);
      const originalPriceInStars = product.originalPriceInStars || 
        (product.originalPrice ? kopecksToStars(product.originalPrice) : priceInStars);
      const monthlyEquivalentInStars = product.monthlyEquivalentInStars || 
        (product.monthlyEquivalent ? kopecksToStars(product.monthlyEquivalent) : priceInStars);

      return {
        ...product,
        priceInStars,
        originalPriceInStars,
        monthlyEquivalentInStars
      };
    });
  }, [products]);

  const getDisplayPrice = (product: PaywallProduct) => {
    if (selectedCurrency === 'STARS') {
      return product.priceInStars || kopecksToStars(product.price);
    }
    return product.price;
  };

  const getDisplayOriginalPrice = (product: PaywallProduct) => {
    if (selectedCurrency === 'STARS') {
      return product.originalPriceInStars || 
        (product.originalPrice ? kopecksToStars(product.originalPrice) : null);
    }
    return product.originalPrice;
  };

  const getDisplayMonthlyEquivalent = (product: PaywallProduct) => {
    if (selectedCurrency === 'STARS') {
      return product.monthlyEquivalentInStars || 
        (product.monthlyEquivalent ? kopecksToStars(product.monthlyEquivalent) : null);
    }
    return product.monthlyEquivalent;
  };

  return {
    productsWithCalculatedPrices,
    getDisplayPrice,
    getDisplayOriginalPrice,
    getDisplayMonthlyEquivalent
  };
};
