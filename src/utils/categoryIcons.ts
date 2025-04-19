
import { ShoppingBag, Coffee, Bus, Film, Gift, Tv, Home, BadgeDollarSign } from 'lucide-react';

export function getCategoryIcon(name: string) {
  switch (name) {
    case 'shopping-bag':
      return ShoppingBag;
    case 'coffee':
      return Coffee;
    case 'bus':
      return Bus;
    case 'film':
      return Film;
    case 'gift':
      return Gift;
    case 'tv':
      return Tv;
    case 'home':
      return Home;
    default:
      return BadgeDollarSign;
  }
}
