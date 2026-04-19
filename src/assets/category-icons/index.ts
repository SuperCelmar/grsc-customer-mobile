import type { ComponentType, SVGProps } from 'react'
import { createElement } from 'react'

import hotCoffeeRaw from './hot-coffee.svg?raw'
import coldCoffeeRaw from './cold-coffee.svg?raw'
import shakesRaw from './shakes.svg?raw'
import snacksRaw from './snacks.svg?raw'
import sandwichesRaw from './sandwiches.svg?raw'
import bakeryRaw from './bakery.svg?raw'
import dessertsRaw from './desserts.svg?raw'
import breakfastRaw from './breakfast.svg?raw'
import performanceCoffeeRaw from './performance-coffee.svg?raw'
import hampersRaw from './hampers.svg?raw'
import cafeRaw from './cafe.svg?raw'
import coldBrewsRaw from './cold-brews.svg?raw'
import proteinShakeRaw from './protein-shake.svg?raw'
import rewardsRaw from './rewards.svg?raw'
import genericRaw from './generic.svg?raw'

export type CategoryIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>

function makeIcon(raw: string): CategoryIcon {
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')
  return function Icon({ className, ...props }) {
    return createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className,
      ...props,
      dangerouslySetInnerHTML: { __html: inner },
    })
  }
}

const HotCoffeeIcon = makeIcon(hotCoffeeRaw)
const ColdCoffeeIcon = makeIcon(coldCoffeeRaw)
const ShakesIcon = makeIcon(shakesRaw)
const SnacksIcon = makeIcon(snacksRaw)
const SandwichesIcon = makeIcon(sandwichesRaw)
const BakeryIcon = makeIcon(bakeryRaw)
const DessertsIcon = makeIcon(dessertsRaw)
const BreakfastIcon = makeIcon(breakfastRaw)
const PerformanceCoffeeIcon = makeIcon(performanceCoffeeRaw)
const HampersIcon = makeIcon(hampersRaw)
export const CafeIcon = makeIcon(cafeRaw)
export const ColdBrewsIcon = makeIcon(coldBrewsRaw)
export const ProteinShakeIcon = makeIcon(proteinShakeRaw)
export const RewardsIcon = makeIcon(rewardsRaw)
export { PerformanceCoffeeIcon, HampersIcon }
export const GenericIcon = makeIcon(genericRaw)

const iconRegistry: Record<string, CategoryIcon> = {
  'hot coffee': HotCoffeeIcon,
  'hot coffees': HotCoffeeIcon,
  'coffee': HotCoffeeIcon,
  'espresso': HotCoffeeIcon,
  'tea': HotCoffeeIcon,
  'hot beverages': HotCoffeeIcon,
  'cold coffee': ColdCoffeeIcon,
  'cold coffees': ColdCoffeeIcon,
  'iced coffee': ColdCoffeeIcon,
  'cold brew': ColdBrewsIcon,
  'cold brews': ColdBrewsIcon,
  'cold beverages': ColdCoffeeIcon,
  'shakes': ShakesIcon,
  'shake': ShakesIcon,
  'protein shake': ProteinShakeIcon,
  'protein shakes': ProteinShakeIcon,
  'smoothies': ShakesIcon,
  'smoothie': ShakesIcon,
  'frappes': ShakesIcon,
  'milkshakes': ShakesIcon,
  'snacks': SnacksIcon,
  'snack': SnacksIcon,
  'chips': SnacksIcon,
  'bites': SnacksIcon,
  'energy bites': SnacksIcon,
  'sandwiches': SandwichesIcon,
  'sandwich': SandwichesIcon,
  'wraps': SandwichesIcon,
  'burgers': SandwichesIcon,
  'bakery': BakeryIcon,
  'pastries': BakeryIcon,
  'pastry': BakeryIcon,
  'croissants': BakeryIcon,
  'bread': BakeryIcon,
  'desserts': DessertsIcon,
  'dessert': DessertsIcon,
  'cakes': DessertsIcon,
  'cake': DessertsIcon,
  'sweets': DessertsIcon,
  'breakfast': BreakfastIcon,
  'breakfasts': BreakfastIcon,
  'performance coffee': PerformanceCoffeeIcon,
  'beans': PerformanceCoffeeIcon,
  'coffee beans': PerformanceCoffeeIcon,
  'hampers': HampersIcon,
  'hamper': HampersIcon,
  'gift hampers': HampersIcon,
  'gifts': HampersIcon,
}

export function getCategoryIcon(name: string | undefined | null): CategoryIcon | null {
  if (!name) return null
  return iconRegistry[name.toLowerCase().trim()] ?? null
}
