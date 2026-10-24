import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { Painting } from '../models/Painting.js';
import { User } from '../models/User.js';

// Reliable fallback painting dataset reflecting boutique art studio works
export const FALLBACK_PAINTINGS = [
  {
    title: 'Echoes of Autumn Silence',
    description: 'A contemplative abstract landscape rendering golden light filtering through autumn mist and ancient forest canopy.',
    price: 650,
    medium: 'Oil and cold wax on linen',
    dimensions: '30" x 40"',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
  },
  {
    title: 'Terracotta Coastline at Dawn',
    description: 'Rich earth pigments, burnt sienna, and warm ivory strokes capturing Mediterranean sea cliffs at sunrise.',
    price: 820,
    medium: 'Acrylic and mineral pigments on canvas',
    dimensions: '36" x 48"',
    imageUrl: 'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
  },
  {
    title: 'Botanical Geometry in Sage',
    description: 'Minimalist organic study balancing delicate wild flora shapes with muted sage and deep charcoal linework.',
    price: 490,
    medium: 'Oil and graphite on cradled panel',
    dimensions: '24" x 30"',
    imageUrl: 'https://images.unsplash.com/photo-1582561141978-8edda941994b?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
  },
  {
    title: 'Solitude Over the Moor',
    description: 'Deep textural impasto depicting rolling hills and dramatic tempestuous skies in dusky violet and ochre.',
    price: 950,
    medium: 'Oil on Belgian linen',
    dimensions: '40" x 50"',
    imageUrl: 'https://images.unsplash.com/photo-1577720643272-265f09367456?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
  },
  {
    title: 'Architectural Shadows: Archway III',
    description: 'Geometric interplay of desert light and terracotta arches inspired by classical Mediterranean courtyard courtyards.',
    price: 580,
    medium: 'Acrylic on raw canvas',
    dimensions: '28" x 36"',
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
  },
  {
    title: 'Whispers of Tidal Drift',
    description: 'Fluid ocean blues, sea-spray ivory, and weathered sand textures evoking tranquil coastal shorelines.',
    price: 740,
    medium: 'Mixed media and oil on wood panel',
    dimensions: '32" x 42"',
    imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
  },
];

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Inspecting existing paintings in database...');
    for (const paintingData of FALLBACK_PAINTINGS) {
      // Avoid duplicate records by checking for title
      const existing = await Painting.findOne({ title: paintingData.title });
      if (!existing) {
        await Painting.create(paintingData);
        console.log(`[Seed] Added painting: "${paintingData.title}" - $${paintingData.price}`);
      } else {
        console.log(`[Seed] Painting already exists: "${paintingData.title}"`);
      }
    }

    console.log('[Seed] Database seed completed successfully!');
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
  } finally {
    await disconnectDB();
  }
};

// Execute if run directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
