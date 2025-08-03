import React from 'react';

import {
  Baby,
  Bike,
  Book,
  Briefcase,
  Brush,
  Bus,
  Calculator,
  Calendar,
  Camera,
  Car,
  Cat,
  Clock,
  Cloud,
  Coffee,
  Coins,
  CreditCard,
  Cross,
  Dog,
  DollarSign,
  Dumbbell,
  Film,
  Fish,
  Flower,
  Fuel,
  Gamepad2,
  Gift,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Hospital,
  Key,
  Laptop,
  Library,
  Mail,
  MapPin,
  Moon,
  MoreHorizontal,
  Mountain,
  Music,
  Palette,
  Pencil,
  Phone,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  Receipt,
  Ruler,
  Scissors,
  Shield,
  Shirt,
  ShoppingBag,
  Star,
  Stethoscope,
  Sun,
  Tag,
  Train,
  TreePine,
  Trophy,
  Umbrella,
  UserCheck,
  Users,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Map icon strings to Lucide components
export const iconMap: Record<string, LucideIcon> = {
  // Food & Dining
  utensils: Utensils,
  coffee: Coffee,
  pizza: Pizza,
  // Transportation
  car: Car,
  bike: Bike,
  bus: Bus,
  train: Train,
  plane: Plane,
  fuel: Fuel,
  // Shopping & Money
  'shopping-bag': ShoppingBag,
  shirt: Shirt,
  gift: Gift,
  'dollar-sign': DollarSign,
  dollar: DollarSign,
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
  coins: Coins,
  calculator: Calculator,
  receipt: Receipt,
  // Entertainment & Media
  film: Film,
  gamepad2: Gamepad2,
  music: Music,
  camera: Camera,
  book: Book,
  // Home & Living
  home: Home,
  zap: Zap,
  wrench: Wrench,
  scissors: Scissors,
  brush: Brush,
  // Health & Medical
  heart: Heart,
  stethoscope: Stethoscope,
  pill: Pill,
  hospital: Hospital,
  cross: Cross,
  // Technology
  laptop: Laptop,
  phone: Phone,
  shield: Shield,
  // Work & Education
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  library: Library,
  pencil: Pencil,
  ruler: Ruler,
  // Sports & Fitness
  dumbbell: Dumbbell,
  trophy: Trophy,
  // Nature & Weather
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  umbrella: Umbrella,
  flower: Flower,
  'tree-pine': TreePine,
  mountain: Mountain,
  // Pets & Animals
  dog: Dog,
  cat: Cat,
  fish: Fish,
  baby: Baby,
  // Places & Navigation
  'map-pin': MapPin,
  globe: Globe,
  // Time & Communication
  clock: Clock,
  calendar: Calendar,
  mail: Mail,
  // People & Social
  users: Users,
  'user-check': UserCheck,
  // Miscellaneous
  tag: Tag,
  key: Key,
  star: Star,
  'more-horizontal': MoreHorizontal,
};

// Component to render category icon
export const CategoryIcon: React.FC<{
  iconName: string;
  className?: string;
  color?: string;
}> = ({ iconName, className = 'w-5 h-5', color }) => {
  const IconComponent = iconMap[iconName] || Tag;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};
