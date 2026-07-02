/**
 * Science-backed habit catalog.
 *
 * The catalog maps common habits (the DB habit_templates and typical
 * user-created names) to educational content that lives in i18n under
 * `habitCatalog.<slug>.*`: what the science says, short/long-term benefits,
 * how to start well, and the frustrations to expect.
 *
 * Matching is client-side by normalized name (works retroactively for habits
 * already created from templates), so no DB migration is needed.
 */

export interface HabitCatalogEntry {
  /** i18n namespace: habitCatalog.<slug> */
  slug: string;
  /** normalized names/keywords (es + en) that map a habit to this entry */
  aliases: string[];
  /** lucide icon shown in the science sheet header */
  iconName: string;
}

/** lowercase, strip accents/diacritics, collapse spaces */
export function normalizeHabitName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const HABIT_CATALOG: HabitCatalogEntry[] = [
  {
    slug: 'hydration',
    iconName: 'Droplets',
    aliases: ['beber 2l de agua', 'drink 2l of water', 'beber agua', 'drink water', 'hidratacion', 'hidratarme', 'tomar agua'],
  },
  {
    slug: 'exercise',
    iconName: 'Dumbbell',
    aliases: ['hacer ejercicio 30 min', 'exercise 30 min', 'ejercicio', 'entrenamiento', 'entrenar', 'workout', 'ir al gimnasio', 'gym', 'correr', 'salir a caminar', 'caminar'],
  },
  {
    slug: 'sleep',
    iconName: 'Moon',
    aliases: ['dormir 8 horas', 'sleep 8 hours', 'dormir bien', 'acostarme temprano', 'sleep early', 'higiene del sueno'],
  },
  {
    slug: 'meditation',
    iconName: 'Sprout',
    aliases: ['meditar 10 minutos', 'meditate 10 minutes', 'meditacion', 'meditar', 'mindfulness', 'respiracion consciente', 'respirar'],
  },
  {
    slug: 'nutrition',
    iconName: 'Apple',
    aliases: ['comer una fruta', 'eat a fruit', 'comer fruta', 'comer sano', 'comida saludable', 'eat healthy', 'verduras'],
  },
  {
    slug: 'reading',
    iconName: 'BookOpen',
    aliases: ['leer 20 paginas', 'read 20 pages', 'lectura', 'leer', 'reading', 'leer un libro'],
  },
  {
    slug: 'journaling',
    iconName: 'NotebookPen',
    aliases: ['escribir en mi diario', 'journal', 'journaling', 'diario', 'escribir diario', 'escribir'],
  },
  {
    slug: 'instrument',
    iconName: 'Music',
    aliases: ['practicar un instrumento', 'practice an instrument', 'tocar guitarra', 'tocar piano', 'practicar musica'],
  },
  {
    slug: 'drawing',
    iconName: 'Palette',
    aliases: ['dibujar o bocetar', 'draw or sketch', 'dibujar', 'bocetar', 'pintar', 'drawing'],
  },
  {
    slug: 'study',
    iconName: 'GraduationCap',
    aliases: ['estudiar 30 minutos', 'study 30 minutes', 'estudiar', 'actualizar habilidades', 'update skills', 'aprender', 'curso online', 'practicar ingles'],
  },
  {
    slug: 'planning',
    iconName: 'ClipboardList',
    aliases: ['planificar el dia', 'plan the day', 'planear el dia', 'planificar', 'organizar el dia', 'to-do list'],
  },
  {
    slug: 'deep-work',
    iconName: 'Target',
    aliases: ['trabajo enfocado sin distracciones', 'focused work', 'trabajo profundo', 'deep work', 'trabajo enfocado', 'pomodoro'],
  },
  {
    slug: 'expense-tracking',
    iconName: 'Wallet',
    aliases: ['registrar gastos del dia', 'track expenses', 'registrar gastos', 'revisar presupuesto', 'review budget', 'presupuesto', 'finanzas'],
  },
  {
    slug: 'saving',
    iconName: 'PiggyBank',
    aliases: ['ahorrar algo de dinero', 'save money', 'ahorrar', 'no compras impulsivas', 'no impulse buying', 'ahorro'],
  },
  {
    slug: 'social-connection',
    iconName: 'Users',
    aliases: ['llamar a un amigo o familiar', 'call a friend', 'llamar a mis padres', 'call my parents', 'cenar en familia', 'family dinner', 'jugar con los ninos', 'conocer a alguien nuevo', 'meet someone new', 'llamar a un amigo'],
  },
  {
    slug: 'gratitude',
    iconName: 'HeartHandshake',
    aliases: ['enviar un mensaje de gratitud', 'gratitude message', 'gratitud', 'agradecer', 'diario de gratitud', 'gratitude journal', 'tres cosas buenas'],
  },
  {
    slug: 'quit-smoking',
    iconName: 'Ban',
    aliases: ['dejar de fumar', 'quit smoking', 'no fumar', 'sin cigarrillos', 'no vapear', 'dejar el vape'],
  },
  {
    slug: 'quit-screens',
    iconName: 'SmartphoneNfc',
    aliases: ['menos pantallas', 'sin redes sociales', 'quit social media', 'dejar redes sociales', 'no celular en la cama', 'no phone in bed', 'sin celular', 'menos celular', 'no doomscrolling'],
  },
  {
    slug: 'quit-alcohol',
    iconName: 'WineOff',
    aliases: ['no beber alcohol', 'sin alcohol', 'quit alcohol', 'dejar el alcohol', 'no tomar'],
  },
  {
    slug: 'quit-sugar',
    iconName: 'CandyOff',
    aliases: ['sin azucar', 'no azucar', 'quit sugar', 'dejar el azucar', 'no dulces', 'sin gaseosa', 'no soda'],
  },
];

/**
 * Find the catalog entry for a habit/template name.
 * Exact normalized match first, then substring containment (≥5 chars) so
 * user-tweaked names like "Leer antes de dormir" still match "leer".
 */
export function findCatalogEntry(name: string): HabitCatalogEntry | null {
  const normalized = normalizeHabitName(name);
  if (!normalized) return null;

  for (const entry of HABIT_CATALOG) {
    if (entry.aliases.some((a) => a === normalized)) return entry;
  }
  for (const entry of HABIT_CATALOG) {
    if (
      entry.aliases.some(
        (a) =>
          (a.length >= 5 && normalized.includes(a)) ||
          (normalized.length >= 5 && a.includes(normalized))
      )
    ) {
      return entry;
    }
  }
  return null;
}
